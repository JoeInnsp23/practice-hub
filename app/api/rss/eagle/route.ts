import { NextResponse } from "next/server";

const EAGLE_FEED_URL = "https://www.eagle-education.co.uk/feed/";

export async function GET() {
  try {
    const response = await fetch(EAGLE_FEED_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Unexpected response: ${response.status}`);
    }

    const xml = await response.text();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Eagle RSS proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Eagle Education blog feed" },
      { status: 500 },
    );
  }
}
