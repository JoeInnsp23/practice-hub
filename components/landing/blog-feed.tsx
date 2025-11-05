"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

interface BlogPost {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  description: string;
  creator?: string;
}

const BLOG_FEED_ENDPOINT = "/api/rss/eagle";

/**
 * Blog Feed Component
 *
 * Fetches and displays latest 6 blog posts from eagle-education.co.uk
 * - Parses RSS feed via local proxy to avoid CORS
 * - Displays beautiful cards
 * - Links to full articles
 * - Shows author and date
 * - Live data
 */
export function BlogFeed() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await fetch(BLOG_FEED_ENDPOINT, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch blog feed");
        }

        const contentType = response.headers.get("content-type") || "";
        const text = await response.text();

        if (!contentType.includes("xml") && !contentType.includes("rss")) {
          throw new Error("Unexpected blog feed format");
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
          throw new Error("Failed to parse blog feed");
        }

        const items = xmlDoc.getElementsByTagName("item");
        const blogPosts: BlogPost[] = [];

        for (let i = 0; i < Math.min(6, items.length); i++) {
          const item = items[i];
          const titleEl = item.getElementsByTagName("title")[0];
          const linkEl = item.getElementsByTagName("link")[0];
          const pubDateEl = item.getElementsByTagName("pubDate")[0];
          const descriptionEl = item.getElementsByTagName("description")[0];
          const creatorEl = item.getElementsByTagName("dc:creator")[0];

          blogPosts.push({
            id: `${i}-${titleEl?.textContent || ""}`.substring(0, 50),
            title: titleEl?.textContent || "Untitled",
            link: linkEl?.textContent || "",
            pubDate: pubDateEl?.textContent || new Date().toISOString(),
            description: descriptionEl?.textContent || "",
            creator: creatorEl?.textContent || undefined,
          });
        }

        setPosts(blogPosts);
        setError(null);
      } catch (err) {
        console.error("Blog feed error:", err);
        setError(
          "We couldn't load the latest Eagle Education posts right now. Please try again later.",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchBlogPosts();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    const text = (tmp.textContent || tmp.innerText || "").substring(0, 150);
    return `${text}...`;
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">Loading latest blog posts...</p>
        </div>
      </section>
    );
  }

  if (error || posts.length === 0) {
    return (
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">
            {error ?? "No blog posts available right now."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8 md:py-12 -mt-8 md:-mt-12">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Latest from the Blog
          </h2>
          <p className="text-lg text-muted-foreground">
            Insights and expertise from Eagle Education
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <a
              key={post.id}
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`group glass-card rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-lift-in`}
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Date Badge */}
              <div className="inline-block mb-4 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                {formatDate(post.pubDate)}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>

              {/* Author */}
              {post.creator && (
                <p className="text-xs text-muted-foreground mb-3 font-medium">
                  By {post.creator}
                </p>
              )}

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {stripHtml(post.description)}
              </p>

              {/* Read More Link */}
              <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Read article</span>
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
