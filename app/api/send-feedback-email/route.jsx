import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_CONFIG = {
    service: 'gmail',
    auth: {
        user: 'aiinterviewer08@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD // You'll need to set this in your environment variables
    }
};

// Create email template
function createEmailTemplate(data) {
    const { candidateName, feedback, recommendationMessage, interviewDate, scores } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Practice Feedback - PrepAI</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .skill-bar { background: #e0e0e0; height: 20px; border-radius: 10px; margin: 8px 0; }
        .skill-fill { background: #4F46E5; height: 100%; border-radius: 10px; transition: width 0.3s; }
        .recommendation { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .score { font-size: 24px; font-weight: bold; color: #4F46E5; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 PrepAI - Practice Session Feedback</h1>
            <p>Your Practice Results</p>
        </div>
        
        <div class="content">
            <h2>Hello ${candidateName},</h2>
            
            <p>Thank you for completing your AI-powered practice session on <strong>${interviewDate}</strong>. Here is your detailed performance feedback.</p>
            
            <h3>📊 Overall Performance Score</h3>
            <div style="text-align: center; margin: 20px 0;">
                <span class="score">${scores.overall}/10</span>
            </div>
            
            <h3>🎯 Skills Assessment</h3>
            
            <div style="margin: 20px 0;">
                <h4>Technical Skills: ${scores.technical}/10</h4>
                <div class="skill-bar">
                    <div class="skill-fill" style="width: ${(scores.technical/10)*100}%"></div>
                </div>
                
                <h4>Communication: ${scores.communication}/10</h4>
                <div class="skill-bar">
                    <div class="skill-fill" style="width: ${(scores.communication/10)*100}%"></div>
                </div>
                
                <h4>Problem Solving: ${scores.problemSolving}/10</h4>
                <div class="skill-bar">
                    <div class="skill-fill" style="width: ${(scores.problemSolving/10)*100}%"></div>
                </div>
                
                <h4>Experience: ${scores.experience}/10</h4>
                <div class="skill-bar">
                    <div class="skill-fill" style="width: ${(scores.experience/10)*100}%"></div>
                </div>
            </div>
            
            <h3>📋 Performance Summary</h3>
            <p style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5;">
                ${feedback.summary || 'No detailed summary available.'}
            </p>
            
            <h3>🏆 System Recommendation</h3>
            <div class="recommendation">
                <strong>Status:</strong> ${feedback.Recommendation || 'Under Review'}<br>
                <strong>Details:</strong> ${feedback.RecommendationMsg || 'No recommendation details available.'}
            </div>
            
            ${recommendationMessage ? `
            <h3>💬 Personal Message from Our Team</h3>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #10B981;">
                <p><em>"${recommendationMessage}"</em></p>
            </div>
            ` : ''}
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>Review the feedback carefully to understand your strengths and areas for improvement</li>
                <li>If you have any questions about the evaluation, feel free to reach out to us</li>
                <li>Keep developing your skills based on the recommendations provided</li>
            </ul>
            
            <p>Thank you for practicing with PrepAI. Keep up the great work!</p>
            
            <p>Best regards,<br>
            <strong>PrepAI Team</strong><br>
            aiinterviewer08@gmail.com</p>
        </div>
        
        <div class="footer">
            <p>This is an automated email from PrepAI. Please do not reply directly to this email.</p>
            <p>© 2025 PrepAI. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}

export async function POST(req) {
    try {
        const emailData = await req.json();
        const { to, candidateName, feedback, recommendationMessage, interviewDate, scores } = emailData;
        
        // Validate required data
        if (!to || !candidateName) {
            return NextResponse.json({
                success: false,
                error: 'Missing required email data'
            }, { status: 400 });
        }

        // Check if email password is configured
        if (!process.env.EMAIL_APP_PASSWORD) {
            console.error('EMAIL_APP_PASSWORD not configured');
            return NextResponse.json({
                success: false,
                error: 'Email service not configured. Please set EMAIL_APP_PASSWORD in environment variables.'
            }, { status: 500 });
        }

        // Validate email password format (should be 16 characters for Gmail app password)
        const emailPassword = process.env.EMAIL_APP_PASSWORD;
        if (emailPassword.length < 10) {
            console.error('EMAIL_APP_PASSWORD appears to be invalid (too short)');
            return NextResponse.json({
                success: false,
                error: 'Invalid email password format. Please use a Gmail App Password (16 characters).'
            }, { status: 500 });
        }

        // Create transporter
        const transporter = nodemailer.createTransport(EMAIL_CONFIG);

        // Verify transporter configuration
        await transporter.verify();

        // Create email content
        const htmlContent = createEmailTemplate(emailData);
        
        // Email options
        const mailOptions = {
            from: {
                name: 'PrepAI',
                address: 'aiinterviewer08@gmail.com'
            },
            to: to,
            subject: `Practice Feedback - ${candidateName} | PrepAI`,
            html: htmlContent
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email sent successfully:', info.messageId);
        
        return NextResponse.json({
            success: true,
            message: 'Feedback email sent successfully',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ Error sending email:', error);
        
        let errorMessage = 'Failed to send email';
        
        if (error.code === 'EAUTH') {
            errorMessage = 'Email authentication failed. Please check email configuration.';
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            errorMessage = 'Cannot connect to email service. Please check internet connection.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}