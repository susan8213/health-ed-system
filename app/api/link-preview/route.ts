import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the webpage content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract metadata using regex (basic implementation)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);

    // Extract favicon
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);

    const title = titleMatch ? titleMatch[1].trim() : '';
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';
    let image = imageMatch ? imageMatch[1].trim() : '';
    let favicon = faviconMatch ? faviconMatch[1].trim() : '';

    // Convert relative URLs to absolute
    const baseUrl = new URL(url);
    if (image && !image.startsWith('http')) {
      image = new URL(image, baseUrl.origin).href;
    }
    if (favicon && !favicon.startsWith('http')) {
      favicon = new URL(favicon, baseUrl.origin).href;
    }

    // If no image found, try to use favicon
    if (!image && favicon) {
      image = favicon;
    }

    return NextResponse.json({
      url,
      title: title || new URL(url).hostname,
      description: description || '',
      image: image || '',
      favicon: favicon || '',
      domain: baseUrl.hostname
    });

  } catch (error) {
    console.error('Error fetching link preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch link preview' },
      { status: 500 }
    );
  }
}