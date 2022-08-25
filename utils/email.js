const nodemailer = require('nodemailer')
const pug = require('pug')  // For turning pug templates into html
const {htmlToText} = require('html-to-text')    // Create text versions of html

module.exports = class Email
{
    constructor(user, url)
    {
        this.to = user.email
        this.firstName = user.name.split(' ')[0]
        this.url = url
        // this.from = `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`
        this.from = process.env.NODE_ENV === 'production' ? `${process.env.FROM_NAME} <${process.env.SENDGRID_FROM_EMAIL}>` : `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`
    }

    newTransport()
    {
        if (process.env.NODE_ENV === 'production')
        {
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD,
                }
            })
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            }
        })
    }

    // Send emails for different scenarios
    async send(template, subject)
    {
        // Will be sending pug template in email
        // Render html based on pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        })

        // Email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            text: htmlToText(html),
            html
        }

        // Create transport and send
        await this.newTransport().sendMail(mailOptions)
    }

    async sendWelcome()
    {
        await this.send('welcome', 'Welcome to the Natours family!')
    }

    async sendPasswordReset()
    {
        await this.send('passwordReset', 'Your password reset token (expires in 10 min)')
    }
}

// const sendEmail = async options => 
// {
//     // If using gmail - activate "less secure app" option in gmail settings
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         auth: {
//             user: process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD,
//         }
//     })

//     const mailOptions = {
//         from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
//         to: options.email,
//         subject: options.subject,
//         text: options.message,
//         //html:
//     }

//     const info = await transporter.sendMail(mailOptions)
// }

// module.exports = sendEmail