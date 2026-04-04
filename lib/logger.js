import fs from 'fs';
import path from 'path';

export const logError = (context, errorDetails) => {
    try {
        const logPath = path.join(process.cwd(), 'interview-errors.log');
        const timestamp = new Date().toISOString();
        
        let formattedDetails = errorDetails;
        if (errorDetails instanceof Error) {
            formattedDetails = `${errorDetails.message}\nStack: ${errorDetails.stack}`;
        } else if (typeof errorDetails === 'object') {
            formattedDetails = JSON.stringify(errorDetails);
        }

        const logEntry = `[${timestamp}] [${context}]\nDetails: ${formattedDetails}\n----------------------------------------\n`;
        
        fs.appendFileSync(logPath, logEntry, 'utf8');
    } catch (e) {
        console.error('Failed to write to log file:', e);
    }
};