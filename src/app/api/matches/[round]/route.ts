// src/app/api/matches/[round]/route.ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { round: string } }
) {
  const { round } = params;
  const token = process.env.GOOD_GAME_LIGAEN_TOKEN;
  
  // Replace <division_id> with the actual division ID or make it dynamic as needed.
  const apiUrl = `https://www.gamer.no/api/paradise/v2/division/<division_id>/matchups?round_number=${round}&include_maps=1&include_streams=1`;

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) {
    return NextResponse.error();
  }
  
  const data = await response.json();
  return NextResponse.json(data);
}
