
import { formatDateToIndian } from '../utils/taskUtils';

// Get Cloud Function URL from environment or use deployed URL
const getCloudFunctionUrl = () => {
  const customUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;
  
  if (customUrl) {
    return customUrl;
  }
  
  // Use the deployed Cloud Function URL
  return 'https://sendemail-jl3d2uhdra-uc.a.run.app';
};

const EMAIL_FUNCTION_URL = getCloudFunctionUrl();

export interface EmailOptions {
  to: string;
  recipientName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/**
 * Send email via Firebase Cloud Function
 * @param options Email options
 * @returns Promise with email send status
 */

export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> => {
  if (!options.to || !options.subject || !options.htmlContent) {
    return { success: false, error: 'Missing required email fields' };
  }

  const brevoApiKey = import.meta.env.VITE_BREVO_API_KEY;
  const brevoSenderEmail = import.meta.env.VITE_BREVO_SENDER_EMAIL || 'hrishikesh@vastcanvas.in';

  if (brevoApiKey && brevoApiKey !== 'your_brevo_api_key_here') {
    // Send directly via Brevo SMTP API
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`✉️ Sending direct Brevo email to ${options.to}...`);
      }
      
      const payload = {
        sender: {
          name: 'Vast Canvas Support',
          email: brevoSenderEmail,
        },
        to: [
          {
            email: options.to,
            name: options.recipientName || options.to.split('@')[0],
          }
        ],
        subject: options.subject,
        htmlContent: options.htmlContent,
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Brevo API error:', errorText);
        return { success: false, error: `Brevo error: ${errorText}` };
      }

      const result = await response.json();
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Email sent successfully via Brevo API:', result.messageId || 'success');
      }
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending direct Brevo email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  } else {
    // Fall back to Cloud Function
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`✉️ Sending email to ${options.to} via Cloud Function...`);
      }

      const payload = {
        to: options.to,
        recipientName: options.recipientName || options.to.split('@')[0],
        subject: options.subject,
        htmlContent: options.htmlContent,
      };

      const response = await fetch(EMAIL_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Cloud Function error:', error);
        return { success: false, error: error.error || 'Failed to send email via Cloud Function' };
      }

      const result = await response.json();
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Email sent successfully via Cloud Function:', result.messageId);
      }
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending email via Cloud Function:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};


/**
 * Send document shared notification
 */
export const sendDocumentSharedEmail = async (
  recipientEmail: string,
  recipientName: string,
  documentName: string,
  projectName: string,
  senderName: string,
  deepLink?: string
): Promise<{ success: boolean; error?: string }> => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="color: #fff; margin: 0; font-size: 24px;">📄 Document Shared</h2>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px;">Hi <strong>${recipientName}</strong>,</p>
        
        <p style="color: #555; font-size: 14px;"><strong>${senderName}</strong> has shared a document with you.</p>
        
        <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 8px 0; color: #333;"><strong>Document:</strong> ${documentName}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Project:</strong> ${projectName}</p>
        </div>
        
        <p style="color: #555; font-size: 14px;">Please review the document in the system.</p>
        
        <p style="margin-top: 30px; color: #999; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Regards,<br>
          <strong>ID ERP System</strong>
        </p>
      </div>
    </div>
  `;

  const finalHtml = deepLink ? htmlContent.replace('</div>\n  </div>\n  `;', `</div>\n  <div style="margin:20px 0; text-align:center;"><a href="${deepLink}" style="display:inline-block;background-color:#0284c7;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Open Document</a></div>\n  </div>\n  `) : htmlContent;

  return sendEmail({
    to: recipientEmail,
    recipientName,
    subject: `Document Shared: ${documentName}`,
    htmlContent: finalHtml,
  });
};

/**
 * Send task due-date reminder email to assignee
 */
export const sendTaskReminder = async (
  recipientEmail: string,
  recipientName: string,
  taskTitle: string,
  projectName: string,
  dueDate: string
): Promise<{ success: boolean; error?: string }> => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="color: #fff; margin: 0; font-size: 24px;">⏰ Task Due Soon</h2>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px;">Hi <strong>${recipientName}</strong>,</p>
        <p style="color: #555; font-size: 14px;">This is a reminder that the following task is due soon.</p>
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 8px 0; color: #333;"><strong>Task:</strong> ${taskTitle}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Project:</strong> ${projectName}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Due Date:</strong> ${formatDateToIndian(dueDate)}</p>
        </div>
        <p style="color: #555; font-size: 14px;">Please log in to the system to review and update the task status.</p>
        <p style="margin-top: 30px; color: #999; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Regards,<br>
          <strong>ID ERP System</strong>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    recipientName,
    subject: `Task Reminder: "${taskTitle}" is due soon`,
    htmlContent,
  });
};
