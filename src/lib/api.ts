export async function fetchData() {
  const response = await fetch("/api/state-payment-comparison");
  if (!response.ok) throw new Error("Failed to fetch data");
  return response.json();
} 