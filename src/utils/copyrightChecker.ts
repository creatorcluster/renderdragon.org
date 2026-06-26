
import { CopyrightResult } from '@/types/copyright';

// YouTube URL pattern
export const YOUTUBE_URL_PATTERN = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

// Extract YouTube ID from URL
export function extractYouTubeID(url: string): string | null {
  const match = url.match(YOUTUBE_URL_PATTERN);
  return match && match[1] ? match[1] : null;
}

// New function to check copyright status that MusicCopyright.tsx needs
export async function checkCopyrightStatus(query: { artist: string; title: string } | { youtube_url: string }): Promise<CopyrightResult> {
  try {
    // Use the correct API URL - this appears to be an external service
    const apiUrl = "https://ltazpjoqbhtqxqvrvnka.supabase.co/functions/v1/check";
    const apiKey = import.meta.env.VITE_GAPPA_API_KEY as string || "gappa_prod_d3cc029d4c6bd5f646ebbbff0842e2c7bf33cec584588b3087e0d65adb2622f1";
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXpwam9xYmh0cXhxdnJ2bmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTUyMDYsImV4cCI6MjA2NTQ5MTIwNn0.-s6KS8ocMGjHCX6eEOEy_pX39QW1-GtfvglpQwsjqOw";

    const body = query;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: CopyrightResult = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking copyright:', error);
    return {
      status: 'unknown' as const,
      title: 'Unknown',
      artist: 'Unknown',
      confidence: 0,
      riskAssessment: 'Unknown',
      recommendedAction: 'Unable to process request',
      platforms: {
        youtube: 'Unable to check',
        twitch: 'Unable to check'
      },
      sources: {
        contentId: 'Unable to check',
        pro: 'Unable to check',
        drm: 'Unable to check',
        publicDomain: 'Unable to check',
        royaltyFree: 'Unknown',
        commercialDatabases: 'Unknown',
        openSources: 'Unknown'
      },
      sourceAnalysis: {
        commercialPresence: false,
        openSourcePresence: false,
        totalMatches: 0
      },
      youtubeAnalysis: {
        totalVideos: 0,
        officialContent: 0,
        userGeneratedContent: 0,
        userContentRatio: 0,
        assessment: 'Unable to analyze'
      },
      riskFactors: {
        commercial: 0,
        popularity: 0,
        official: 0,
        label: 0,
        distribution: 0
      },
      totalRiskScore: 0,
      processingTime: 'N/A',
      sourcesChecked: [],
      sourceStats: {
        total: 0,
        successful: 0,
        coverage: 0
      },
      lastUpdated: new Date().toISOString(),
      apiVersion: '1.0',
      imageUrl: undefined,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
