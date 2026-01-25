import { NextResponse } from "next/server";
import { sendWeeklyDigest } from "@/lib/email";
import { getDb } from "@/lib/db";

// Test endpoint - send a sample digest email with real recipes from the database
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
  }

  try {
    const db = getDb();
    
    // Get real trending recipes from the database
    const recipesResult = await db.execute(`
      SELECT r.id, r.title, r.description, r.image, r.likes, u.name as author
      FROM recipes r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.visibility = 'public'
      ORDER BY r.likes DESC, r.created_at DESC
      LIMIT 5
    `);

    let recipes = recipesResult.rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      image: row.image as string,
      author: row.author as string,
      likes: (row.likes as number) || 0,
    }));

    // If no recipes in database, use sample data
    if (recipes.length === 0) {
      recipes = [
        {
          id: "sample-1",
          title: "Creamy Garlic Tuscan Shrimp",
          description: "A rich and creamy shrimp dish with sun-dried tomatoes and spinach in a parmesan garlic sauce.",
          image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400",
          author: "Chef Maria",
          likes: 127,
        },
        {
          id: "sample-2", 
          title: "Homemade Margherita Pizza",
          description: "Classic Italian pizza with fresh mozzarella, tomatoes, and basil on a crispy thin crust.",
          image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400",
          author: "Pizza Master",
          likes: 98,
        },
        {
          id: "sample-3",
          title: "Korean Fried Chicken",
          description: "Extra crispy double-fried chicken coated in a sweet and spicy gochujang glaze.",
          image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400",
          author: "K-Food Lover",
          likes: 84,
        },
      ];
    }

    const result = await sendWeeklyDigest(email, "there", recipes);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Test email sent to ${email}`,
        recipesIncluded: recipes.length,
        usingRealData: recipesResult.rows.length > 0
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
