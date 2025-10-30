import { NextRequest, NextResponse } from "next/server";
import { BlobServiceClient } from "@azure/storage-blob";

// Safe env getter
function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

// Current BT50 file and sheet resolver (mirror of update flow, but read-only)
function getCurrentFileName(): string {
  return "Medicaid Rates bill sheet with categories.xlsx";
}

async function toBufferFromStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function GET(req: NextRequest) {
  const logs: string[] = [];
  try {
    // Admin auth
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    if (authError) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }

    // Query param: includeOnlyNoServiceLines=true to filter results
    const url = new URL(req.url);
    const onlyNoServiceLines = url.searchParams.get("includeOnlyNoServiceLines") === "true";

    const AZURE_CONNECTION_STRING = getEnv("AZURE_CONNECTION_STRING");
    const CONTAINER_NAME = getEnv("CONTAINER_NAME");

    // 1) Read latest BT50 Excel from Azure
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const fileName = getCurrentFileName();
    const blobClient = containerClient.getBlobClient(fileName);
    const exists = await blobClient.exists();
    if (!exists) {
      return NextResponse.json({ error: `BT50 file not found: ${fileName}` }, { status: 404 });
    }
    const download = await blobClient.download();
    const stream = download.readableStreamBody;
    if (!stream) {
      return NextResponse.json({ error: "Failed to read BT50 file stream" }, { status: 500 });
    }
    const buffer = await toBufferFromStream(stream as any);

    // Parse Excel
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const allSheetNames = workbook.SheetNames;
    const dateSheets = allSheetNames.filter((n) => /^\d{6}$/.test(n)).sort((a, b) => b.localeCompare(a));
    if (dateSheets.length === 0) {
      return NextResponse.json({ error: "No MMDDYY sheets found in BT50 file" }, { status: 400 });
    }
    const latestSheet = dateSheets[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[latestSheet], { defval: "" });

    // Map to normalized objects and collect URLs from Excel
    const columnMap: Record<string, string> = {
      "action date": "action_date",
      "bill number": "bill_number",
      "ai summary": "ai_summary",
      "bill progress": "bill_progress",
      "last action": "last_action",
      "sponsor list": "sponsor_list",
      "service": "service_lines_impacted",
      "service 1": "service_lines_impacted_1",
      "service 2": "service_lines_impacted_2",
      "service 3": "service_lines_impacted_3",
      "service lines impacted": "service_lines_impacted",
      "service lines impacted 1": "service_lines_impacted_1",
      "service lines impacted 2": "service_lines_impacted_2",
      "service lines impacted 3": "service_lines_impacted_3",
    };
    function mapToDbColumns(obj: any) {
      const mapped: any = {};
      for (const key in obj) {
        const cleanKey = key.trim().toLowerCase();
        if (columnMap[cleanKey]) {
          mapped[columnMap[cleanKey]] = obj[key];
        } else {
          mapped[cleanKey] = obj[key];
        }
      }
      return mapped;
    }
    const mappedRows = rawRows.map(mapToDbColumns);
    const excelUrls = new Set<string>(
      mappedRows
        .map((r: any) => (typeof r.url === "string" ? r.url.trim() : ""))
        .filter((u: string) => u.length > 0)
    );

    // 2) Load DB rows from bill_track_50
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    const { data: dbRows, error: dbError } = await supabase
      .from("bill_track_50")
      .select("id,state,bill_number,name,last_action,action_date,sponsor_list,bill_progress,url,ai_summary,service_lines_impacted,service_lines_impacted_1,service_lines_impacted_2,service_lines_impacted_3,is_new");
    if (dbError) {
      return NextResponse.json({ error: `Supabase error: ${dbError.message}` }, { status: 500 });
    }

    // 3) Compute DB - Excel (entries present in DB but not in latest Excel)
    const notInExcel = (dbRows || []).filter((row: any) => {
      const url = typeof row.url === "string" ? row.url.trim() : "";
      return url && !excelUrls.has(url);
    });

    // Optionally filter to rows with no service lines
    const isEmpty = (v: any) => v == null || String(v).trim() === "" || String(v).trim().toUpperCase() === "NULL";
    const withoutServiceLines = notInExcel.filter((row: any) =>
      isEmpty(row.service_lines_impacted) &&
      isEmpty(row.service_lines_impacted_1) &&
      isEmpty(row.service_lines_impacted_2) &&
      isEmpty(row.service_lines_impacted_3)
    );

    const result = onlyNoServiceLines ? withoutServiceLines : notInExcel;

    return NextResponse.json({
      success: true,
      latestSheet,
      excelCount: excelUrls.size,
      dbCount: (dbRows || []).length,
      missingFromExcelCount: result.length,
      items: result.slice(0, 500),
      note: "This is read-only. No changes made.",
    });
  } catch (error: any) {
    logs.push(error?.message || String(error));
    return NextResponse.json({ success: false, error: error?.message || String(error), logs }, { status: 500 });
  }
}


