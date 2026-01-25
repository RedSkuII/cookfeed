import { Resend } from "resend";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// From email - you'll need to verify a domain in Resend for production
// For now, use their default onboarding email
const FROM_EMAIL = process.env.FROM_EMAIL || "CookFeed <onboarding@resend.dev>";

interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  author: string;
  likes: number;
}

export async function sendWeeklyDigest(
  userEmail: string,
  userName: string,
  trendingRecipes: Recipe[]
) {
  const recipeListHtml = trendingRecipes
    .map(
      (recipe) => `
        <div style="margin-bottom: 24px; border-bottom: 1px solid #eee; padding-bottom: 24px;">
          ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" style="width: 100%; max-width: 400px; border-radius: 12px; margin-bottom: 12px;">` : ""}
          <h3 style="margin: 0 0 8px; color: #333; font-size: 18px;">${recipe.title}</h3>
          <p style="margin: 0 0 8px; color: #666; font-size: 14px;">${recipe.description || "A delicious recipe"}</p>
          <p style="margin: 0; color: #888; font-size: 12px;">By ${recipe.author || "Anonymous"} • ${recipe.likes} likes</p>
        </div>
      `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 28px;">🍳 CookFeed</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your Weekly Recipe Digest</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <p style="margin: 0 0 24px; color: #333; font-size: 16px;">
              Hi ${userName || "there"}! 👋
            </p>
            <p style="margin: 0 0 24px; color: #666; font-size: 15px;">
              Here are the trending recipes from this week that we think you'll love:
            </p>
            
            ${recipeListHtml || "<p style='color: #666;'>No trending recipes this week. Be the first to share one!</p>"}
            
            <div style="margin-top: 32px; text-align: center;">
              <a href="https://cookfeed.vercel.app/feed" style="display: inline-block; background: #f97316; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Explore More Recipes
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9f9f9; padding: 24px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0 0 8px; color: #888; font-size: 12px;">
              You're receiving this because you subscribed to CookFeed's weekly digest.
            </p>
            <p style="margin: 0; color: #888; font-size: 12px;">
              <a href="https://cookfeed.vercel.app/settings/notifications" style="color: #f97316;">Unsubscribe</a> from these emails.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `🍳 Your Weekly Recipe Digest from CookFeed`,
      html,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: err };
  }
}
