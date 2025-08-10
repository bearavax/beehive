const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beehive_wellington',
  password: 'password',
  port: 5432,
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting to seed PostgreSQL database...');
    
    // Check if categories already exist
    const existingCategories = await client.query('SELECT COUNT(*) FROM categories');
    if (existingCategories.rows[0].count > 0) {
      console.log('✅ Categories already exist, skipping seeding');
      return;
    }

    // Insert categories
    const categories = [
      { name: 'Cafes', description: 'Best cafes in Wellington' },
      { name: 'Community Initiatives', description: 'Local community projects and initiatives' },
      { name: 'Cycling Routes', description: 'Popular cycling routes around Wellington' },
      { name: 'City Improvements', description: 'Suggestions for improving Wellington' },
      { name: 'Restaurants', description: 'Best restaurants in Wellington' },
    ];

    for (const category of categories) {
      const result = await client.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
        [category.name, category.description]
      );
      console.log(`✅ Category: ${category.name} (ID: ${result.rows[0].id})`);
    }

    // Insert vote options
    const voteOptions = [
      // Cafes (category_id: 1)
      { category_id: 1, name: 'Prefab', description: 'Specialty coffee and cabinet food', location: 'Jessie Street' },
      { category_id: 1, name: 'Flight Coffee', description: 'Award-winning specialty coffee', location: 'Hangar' },
      { category_id: 1, name: 'Havana Coffee Works', description: 'Wellington coffee institution', location: 'Tory Street' },
      { category_id: 1, name: 'L\'affare', description: 'Italian-style coffee', location: 'Various locations' },
      { category_id: 1, name: 'Mojo Coffee', description: 'Local coffee roaster', location: 'Various locations' },
      
      // Community Initiatives (category_id: 2)
      { category_id: 2, name: 'Community Gardens Project', description: 'Expanding urban growing spaces' },
      { category_id: 2, name: 'Youth Mentorship Program', description: 'Supporting local young people' },
      { category_id: 2, name: 'Beach Cleanup Initiative', description: 'Keeping Wellington\'s coastline pristine' },
      { category_id: 2, name: 'Food Bank Support', description: 'Addressing food insecurity' },
      
      // Cycling Routes (category_id: 3)
      { category_id: 3, name: 'Wellington Waterfront', description: 'Scenic harbor-side cycling path' },
      { category_id: 3, name: 'Hutt River Trail', description: 'Beautiful river valley route' },
      { category_id: 3, name: 'Makara Peak', description: 'Mountain biking paradise with city views' },
      { category_id: 3, name: 'Petone to Eastbourne', description: 'Coastal ride through Lower Hutt' },
      
      // City Improvements (category_id: 4)
      { category_id: 4, name: 'More Protected Bike Lanes', description: 'Safer cycling infrastructure' },
      { category_id: 4, name: 'Public WiFi Expansion', description: 'Free internet in more locations' },
      { category_id: 4, name: 'Additional Bus Shelters', description: 'Weather protection for commuters' },
      { category_id: 4, name: 'Park Playground Updates', description: 'Modern equipment for families' },
      
      // Restaurants (category_id: 5)
      { category_id: 5, name: 'Charley Noble', description: 'Waterfront eatery with great views' },
      { category_id: 5, name: 'Logan Brown', description: 'Fine dining in former bank building' },
      { category_id: 5, name: 'Little Penang', description: 'Authentic Malaysian cuisine' },
      { category_id: 5, name: 'Ortega Fish Shack', description: 'Fresh seafood and cocktails' },
    ];

    for (const option of voteOptions) {
      await client.query(
        'INSERT INTO vote_options (category_id, name, description, location) VALUES ($1, $2, $3, $4)',
        [option.category_id, option.name, option.description, option.location]
      );
      console.log(`  ➡️ Option: ${option.name}`);
    }

    console.log('🌱 PostgreSQL database seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${voteOptions.length} voting options`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };