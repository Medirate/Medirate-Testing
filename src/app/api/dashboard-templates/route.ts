import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createServiceClient } from "@/lib/supabase";

// GET - Fetch all templates for the current user
export async function GET(request: NextRequest) {
  try {
    const { getUser } = await getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    
    // Get user ID from User table
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("UserID")
      .eq("Email", user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pageName = request.nextUrl.searchParams.get("page") || "dashboard";

    // Fetch templates for this user and page
    const { data: templates, error } = await supabase
      .from("dashboard_templates")
      .select("*")
      .eq("user_id", userData.UserID)
      .eq("page_name", pageName)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error("Error in GET /api/dashboard-templates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new template
export async function POST(request: NextRequest) {
  try {
    const { getUser } = await getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { template_name, template_data, page_name = "dashboard" } = body;

    if (!template_name || !template_data) {
      return NextResponse.json(
        { error: "template_name and template_data are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // Get user ID from User table
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("UserID")
      .eq("Email", user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if template name already exists for this user and page
    const { data: existing } = await supabase
      .from("dashboard_templates")
      .select("id")
      .eq("user_id", userData.UserID)
      .eq("template_name", template_name)
      .eq("page_name", page_name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Template name already exists" },
        { status: 409 }
      );
    }

    // Create new template
    const { data: template, error: insertError } = await supabase
      .from("dashboard_templates")
      .insert({
        user_id: userData.UserID,
        template_name,
        page_name,
        template_data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating template:", insertError);
      return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error in POST /api/dashboard-templates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update a template (rename or update data)
export async function PUT(request: NextRequest) {
  try {
    const { getUser } = await getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, template_name, template_data } = body;

    if (!id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // Get user ID from User table
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("UserID")
      .eq("Email", user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify template belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("dashboard_templates")
      .select("*")
      .eq("id", id)
      .eq("user_id", userData.UserID)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // If renaming, check for duplicate names
    if (template_name && template_name !== existing.template_name) {
      const { data: duplicate } = await supabase
        .from("dashboard_templates")
        .select("id")
        .eq("user_id", userData.UserID)
        .eq("template_name", template_name)
        .eq("page_name", existing.page_name)
        .neq("id", id)
        .single();

      if (duplicate) {
        return NextResponse.json(
          { error: "Template name already exists" },
          { status: 409 }
        );
      }
    }

    // Update template
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (template_name) updateData.template_name = template_name;
    if (template_data) updateData.template_data = template_data;

    const { data: template, error: updateError } = await supabase
      .from("dashboard_templates")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating template:", updateError);
      return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error in PUT /api/dashboard-templates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a template
export async function DELETE(request: NextRequest) {
  try {
    const { getUser } = await getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // Get user ID from User table
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("UserID")
      .eq("Email", user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify template belongs to user and delete
    const { error: deleteError } = await supabase
      .from("dashboard_templates")
      .delete()
      .eq("id", id)
      .eq("user_id", userData.UserID);

    if (deleteError) {
      console.error("Error deleting template:", deleteError);
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/dashboard-templates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

