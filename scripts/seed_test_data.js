require('dotenv').config();
const db = require('../src/database/connection');
const dayjs = require('dayjs');

async function seed() {
  try {
    const phone = process.env.SUPERADMIN_PHONE;
    if (!phone) throw new Error('SUPERADMIN_PHONE not set');

    // Get user
    let user = await db('users').where({ phone_number: phone }).first();
    if (!user) {
      console.log('User not found...');
      user = await db('users').first();
    }

    if (!user) {
      console.error(
        'No users found. Please run migration and seeds first: npm run migrate && npm run seed'
      );
      process.exit(1);
    }

    const userId = user.id;
    console.log(`Seeding data for user ID: ${userId} (${user.phone_number})`);

    // Categories
    // Logic: Existing system uses 'paket', 'utang' as income, 'jajan' as expense in reportDataRepository
    // So we map our categories to these types for transactions
    const categories = [
      { name: 'Salary', type: 'income', trxType: 'paket' },
      { name: 'Food', type: 'expense', trxType: 'jajan' },
      { name: 'Transport', type: 'expense', trxType: 'jajan' },
      { name: 'Entertainment', type: 'expense', trxType: 'jajan' },
    ];

    const categoryMap = {};

    for (const cat of categories) {
      const slug = cat.name.toLowerCase();
      let existing = await db('categories').where({ slug }).first();

      if (!existing) {
        const [id] = await db('categories').insert({
          name: cat.name,
          slug: slug,
          type: cat.type,
          is_system: false, // Custom categories
          created_at: new Date(),
          updated_at: new Date(),
        });
        categoryMap[cat.name] = id;
      } else {
        categoryMap[cat.name] = existing.id;
      }
    }

    // Transactions
    const transactions = [];
    const now = dayjs();

    // Income
    transactions.push({
      transaction_date: now.subtract(5, 'day').toDate(),
      amount: 15000000,
      type: 'paket', // Mapped to income
      category: 'Salary',
      category_id: categoryMap['Salary'],
      description: 'Monthly Salary',
    });

    // Add another income
    transactions.push({
      transaction_date: now.subtract(25, 'day').toDate(),
      amount: 5000000,
      type: 'paket',
      category: 'Salary',
      category_id: categoryMap['Salary'],
      description: 'Bonus',
    });

    // Expenses
    for (let i = 0; i < 30; i++) {
      const date = now.subtract(i, 'day').toDate();

      // Food
      transactions.push({
        transaction_date: date,
        amount: Math.floor(Math.random() * 50000) + 20000,
        type: 'jajan', // Mapped to expense
        category: 'Food',
        category_id: categoryMap['Food'],
        description: 'Lunch',
      });

      // Transport
      if (Math.random() > 0.5) {
        transactions.push({
          transaction_date: date,
          amount: Math.floor(Math.random() * 20000) + 10000,
          type: 'jajan',
          category: 'Transport',
          category_id: categoryMap['Transport'],
          description: 'Gojek',
        });
      }

      // Entertainment
      if (Math.random() > 0.8) {
        transactions.push({
          transaction_date: date,
          amount: Math.floor(Math.random() * 100000) + 50000,
          type: 'jajan',
          category: 'Entertainment',
          category_id: categoryMap['Entertainment'],
          description: 'Movie',
        });
      }
    }

    // Insert
    // Need unique transaction_id string
    let count = 0;
    for (const trx of transactions) {
      count++;
      const idStr = `TRX-SEED-${Date.now()}-${count}`;
      await db('transactions').insert({
        ...trx,
        transaction_id: idStr,
        user_id: userId,
        status: 'approved', // Important for reports!
        created_at: new Date(),
      });
    }

    console.log(`✅ Seeded ${transactions.length} transactions for user ${user.phone_number}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding:', error);
    process.exit(1);
  }
}

seed();
