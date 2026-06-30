const https = require('https');

const sendWhatsApp = (target, message) => {
    return new Promise((resolve, reject) => {
        const token = process.env.FONNTE_TOKEN || 'SCSTfGGWCLSAa2rqLMFe';
        
        // Ensure target is set and formatted correctly
        if (!target) {
            return reject(new Error('Target phone number is required'));
        }

        // Clean target phone number
        let cleanTarget = target.replace(/[^0-9]/g, '');
        // Replace leading 0 with 62 (Indonesia country code) if applicable
        if (cleanTarget.startsWith('0')) {
            cleanTarget = '62' + cleanTarget.slice(1);
        }

        const postData = new URLSearchParams({
            target: cleanTarget,
            message: message,
            countryCode: '62'
        }).toString();

        const options = {
            hostname: 'api.fonnte.com',
            port: 443,
            path: '/send',
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    resolve({ status: false, error: 'Invalid response from Fonnte', raw: data });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
};

module.exports = { sendWhatsApp };
