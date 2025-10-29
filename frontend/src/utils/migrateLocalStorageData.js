/**
 * One-time migration utility to move localStorage income/deduction data to MongoDB
 * This ensures users don't lose their data after implementing authentication
 */

import { userAPI } from './api';

export const migrateLocalStorageToDatabase = async () => {
  try {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping migration');
      return { success: false, message: 'Not authenticated' };
    }

    // Check if migration has already been done
    const migrationDone = localStorage.getItem('dataMigrated');
    if (migrationDone === 'true') {
      console.log('Migration already completed');
      return { success: true, message: 'Already migrated' };
    }

    // Get localStorage data
    const incomeEntries = JSON.parse(localStorage.getItem('incomeEntries') || '[]');
    const deductionEntries = JSON.parse(localStorage.getItem('deductionEntries') || '[]');

    if (incomeEntries.length === 0 && deductionEntries.length === 0) {
      console.log('No data to migrate');
      localStorage.setItem('dataMigrated', 'true');
      return { success: true, message: 'No data to migrate' };
    }

    console.log(`Migrating ${incomeEntries.length} income entries and ${deductionEntries.length} deduction entries...`);

    // Migrate income entries
    let migratedIncome = 0;
    for (const entry of incomeEntries) {
      try {
        await userAPI.addIncomeEntry({
          source: entry.source || 'Other',
          amount: Number(entry.amount) || 0
        });
        migratedIncome++;
      } catch (err) {
        console.error('Failed to migrate income entry:', entry, err);
      }
    }

    // Migrate deduction entries
    let migratedDeductions = 0;
    for (const entry of deductionEntries) {
      try {
        await userAPI.addDeductionEntry({
          section: entry.section || 'Other',
          amount: Number(entry.amount) || 0
        });
        migratedDeductions++;
      } catch (err) {
        console.error('Failed to migrate deduction entry:', entry, err);
      }
    }

    // Mark migration as complete
    localStorage.setItem('dataMigrated', 'true');

    console.log(`✅ Migration complete: ${migratedIncome} income, ${migratedDeductions} deductions`);

    return {
      success: true,
      message: `Migrated ${migratedIncome} income and ${migratedDeductions} deduction entries`,
      incomeCount: migratedIncome,
      deductionCount: migratedDeductions
    };

  } catch (error) {
    console.error('Migration error:', error);
    return {
      success: false,
      message: 'Migration failed',
      error: error.message
    };
  }
};

/**
 * Clear localStorage financial data after successful migration
 * Only call this after confirming data is in MongoDB
 */
export const clearMigratedLocalStorageData = () => {
  const migrationDone = localStorage.getItem('dataMigrated');
  if (migrationDone === 'true') {
    localStorage.removeItem('incomeEntries');
    localStorage.removeItem('deductionEntries');
    console.log('✅ Cleared localStorage financial data after migration');
  }
};
