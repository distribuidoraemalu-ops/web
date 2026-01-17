import { NextResponse } from 'next/server';

import { generateCorrelationId } from '@/lib/correlation';
import { getAccessToken } from '@/lib/vendorAuth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // const q = searchParams.get("q") ?? "";
  const pageNumber = searchParams.get("pageNumber") ?? "1";
  const pageSize = searchParams.get("pageSize") ?? "25";
  const type = searchParams.get("type") ?? "IM::any";

  const token = await getAccessToken();
  const correlationId = generateCorrelationId();
  console.log(correlationId);
  // const correlationId = process.env.IM_CORRELATION_ID!;
  const base = process.env.RESELLER_API_BASE_URL!;

  const vendorUrl = new URL(`${base}/catalog`);
  // vendorUrl.searchParams.set("q", q);
  vendorUrl.searchParams.set("pageNumber", pageNumber);
  vendorUrl.searchParams.set("pageSize", pageSize);
  vendorUrl.searchParams.set("type", type);
  // vendorUrl.searchParams.set("skipAuthorisation", "true");

  const keywords = searchParams.getAll("keyword");
  keywords.forEach((k) => {
    vendorUrl.searchParams.append("keyword", k);
  });

  console.log(vendorUrl.toString());
  const res = await fetch(vendorUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-api-key": process.env.RESELLER_SECRET_KEY!,
      "IM-CustomerNumber": process.env.IM_CUSTOMER_NUMBER!,
      "IM-CorrelationID": correlationId,
      "IM-CountryCode": process.env.IM_COUNTRY_CODE!,
      "Accept": "application/json",
    },
    // Cache list results for 60s
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    console.log(res);
    const text = await res.text();
    return NextResponse.json(
      { error: "Vendor API error", details: text },
      { status: res.status }
    );
  }

  const raw = await res.json();

  // Optional: normalize the response for your UI
  const normalized = raw; // map fields here if needed

  return NextResponse.json(normalized);
}
