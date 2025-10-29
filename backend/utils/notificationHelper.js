const Notification = require('../models/Notification');

/**
 * Helper functions to create notifications for various events
 */

// Create notification for payment success
async function createPaymentNotification(userId, amount, taxYear) {
  try {
    await Notification.create({
      userId,
      title: '💳 Payment Successful',
      message: `Your tax payment of ₹${amount.toLocaleString()} for FY ${taxYear}-${taxYear + 1} has been processed successfully.`,
      type: 'success',
      priority: 'high',
      actionUrl: '/history'
    });
  } catch (error) {
    console.error('Error creating payment notification:', error);
  }
}

// Create notification for document upload
async function createDocumentUploadNotification(userId, docType) {
  try {
    await Notification.create({
      userId,
      title: '📄 Document Uploaded',
      message: `Your ${docType} has been uploaded successfully and is being processed.`,
      type: 'success',
      priority: 'medium',
      actionUrl: '/profile?tab=documents'
    });
  } catch (error) {
    console.error('Error creating document notification:', error);
  }
}

// Create notification for income entry added
async function createIncomeEntryNotification(userId, source, amount, year) {
  try {
    await Notification.create({
      userId,
      title: '💰 Income Entry Added',
      message: `New income from ${source} of ₹${amount.toLocaleString()} has been added for FY ${year}-${year + 1}.`,
      type: 'info',
      priority: 'low',
      actionUrl: '/dashboard'
    });
  } catch (error) {
    console.error('Error creating income notification:', error);
  }
}

// Create notification for deduction entry added
async function createDeductionEntryNotification(userId, section, amount, year) {
  try {
    await Notification.create({
      userId,
      title: '🎯 Deduction Entry Added',
      message: `New deduction under Section ${section} of ₹${amount.toLocaleString()} has been added for FY ${year}-${year + 1}.`,
      type: 'info',
      priority: 'low',
      actionUrl: '/dashboard'
    });
  } catch (error) {
    console.error('Error creating deduction notification:', error);
  }
}

// Create notification for profile update
async function createProfileUpdateNotification(userId, fieldsUpdated) {
  try {
    await Notification.create({
      userId,
      title: '✏️ Profile Updated',
      message: `Your profile has been updated successfully. Fields updated: ${fieldsUpdated.join(', ')}.`,
      type: 'success',
      priority: 'low',
      actionUrl: '/profile'
    });
  } catch (error) {
    console.error('Error creating profile notification:', error);
  }
}

// Create notification for tax record saved
async function createTaxRecordNotification(userId, year, taxAmount) {
  try {
    await Notification.create({
      userId,
      title: '📊 Tax Record Saved',
      message: `Tax record for FY ${year}-${year + 1} has been saved. Total tax: ₹${taxAmount.toLocaleString()}.`,
      type: 'success',
      priority: 'high',
      actionUrl: '/history'
    });
  } catch (error) {
    console.error('Error creating tax record notification:', error);
  }
}

// Create notification for welcome message (new user)
async function createWelcomeNotification(userId, userName) {
  try {
    await Notification.create({
      userId,
      title: '🎉 Welcome to TaxMate!',
      message: `Hi ${userName}! Welcome to TaxMate. Start by adding your income and deduction entries to calculate your tax liability.`,
      type: 'info',
      priority: 'high',
      actionUrl: '/dashboard'
    });
  } catch (error) {
    console.error('Error creating welcome notification:', error);
  }
}

// Create notification for tax deadline reminder
async function createDeadlineReminderNotification(userId) {
  try {
    const currentYear = new Date().getFullYear();
    await Notification.create({
      userId,
      title: '⏰ Tax Filing Deadline Reminder',
      message: `The tax filing deadline for FY ${currentYear - 1}-${currentYear} is approaching on July 31, ${currentYear}. Please ensure all your details are up to date.`,
      type: 'warning',
      priority: 'high',
      actionUrl: '/dashboard',
      expiresAt: new Date(currentYear, 6, 31) // July 31
    });
  } catch (error) {
    console.error('Error creating deadline notification:', error);
  }
}

// Create notification for incomplete profile
async function createIncompleteProfileNotification(userId, missingFields) {
  try {
    await Notification.create({
      userId,
      title: '⚠️ Complete Your Profile',
      message: `Your profile is incomplete. Please add: ${missingFields.join(', ')} to get accurate tax calculations.`,
      type: 'warning',
      priority: 'medium',
      actionUrl: '/profile'
    });
  } catch (error) {
    console.error('Error creating incomplete profile notification:', error);
  }
}

// Create notification for tax savings suggestion
async function createTaxSavingNotification(userId, potentialSavings) {
  try {
    await Notification.create({
      userId,
      title: '💡 Tax Saving Opportunity',
      message: `You can save up to ₹${potentialSavings.toLocaleString()} by maximizing your deductions under Section 80C, 80D, and others.`,
      type: 'info',
      priority: 'medium',
      actionUrl: '/deductions'
    });
  } catch (error) {
    console.error('Error creating tax saving notification:', error);
  }
}

module.exports = {
  createPaymentNotification,
  createDocumentUploadNotification,
  createIncomeEntryNotification,
  createDeductionEntryNotification,
  createProfileUpdateNotification,
  createTaxRecordNotification,
  createWelcomeNotification,
  createDeadlineReminderNotification,
  createIncompleteProfileNotification,
  createTaxSavingNotification
};
