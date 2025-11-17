import { fetchData } from "@/lib/api"; // Your API function to fetch data

export default async function DataProvider({ children }: { children: React.ReactNode }) {
  const data = await fetchData(); // Fetch data on the server

  return (
    <div>
      {children}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__INITIAL_DATA__ = ${JSON.stringify(data)};`,
        }}
      />
    </div>
  );
} 