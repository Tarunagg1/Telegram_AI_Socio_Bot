require('dotenv').config();

const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters')

const bot = new Telegraf(process.env.TELEGRAM_BOT_API);
const userModel = require('./src/models/user.model');
const eventModel = require('./src/models/event');
require('./src/db')()
const OpenAI = require('openai');


const openai = new OpenAI({
    apiKey: process.env['OPEN_AI'], // This is the default and can be omitted
});


bot.start(async (ctx) => {

    const from = ctx.message.from;

    console.log(from);

    try {
        await userModel.findOneAndUpdate({ tgId: from.id }, { firstName: from.first_name, lastName: from.last_name, isBot: from.is_bot, username: from.username }, { upsert: true, new: true });

        console.log('Welcome to social bot');
        ctx.reply('Welcome to social bot..');

    } catch (error) {
        ctx.reply('facing deficulty...');
        console.log(error);
    }

    // store  the user info on db
});


bot.command("generate", async (ctx) => {
    const from = ctx.message.from;

    const { message_id: waitingMessageId } = await ctx.reply(
        `Hey! ${from.first_name}, Kindly wait for a moment. i an curating Posts for you`
    );



    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    startOfDay.setHours(23, 59, 59, 999);

    try {

        const events = await eventModel.find({
            tgId: from.id,
            // createdAt: {
            //     $gte: startOfDay,
            //     $lte: endOfDay
            // }
        });


        if (events.length === 0) {
            await ctx.deleteMessage(waitingMessageId);
            await ctx.reply('No event found');
            return;
        }

        const chatCompletion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: 'Act as a senior copywiter, you write highly engaging posts  for Linkdin, facebook and twitter using provided toughts/events throught the day' },
                {
                    role: 'user', content: `Write like human, for humans. Craft three engaging sociall media posts tailored for Linkdin, facebook and Twiter audiences. use simple language. use give tie labes just to understand the order of the event, don't mention the time in  the post. Each post should creatively highlight the following events. Ensure the tone is conversational and inpactul. Focus on engaging the respective platform's adudience, encouraging intraction, aand driving intrest in the events: 
                    ${events.map((event) => event.text).join(', ')}
                `}
            ],
            model: 'gpt-3.5-turbo',
        });

        await userModel.findOneAndUpdate({ tgId: from.id }, { $inc: { promptTokens: chatCompletion['usage']['prompt_tokens'], completeTokens: chatCompletion['usage']['completion_tokens'] } });

        await ctx.reply(chatCompletion.choices[0].message.content);


        await ctx.deleteMessage(waitingMessageId);
        // await ctx.reply('Doing things...');
    } catch (error) {
        console.log(error);
        ctx.reply('facing deficulty...');
    }
})

bot.on(message('text'), async (ctx) => {

    const from = ctx.message.from;

    const message = ctx.update.message.text;

    try {
        await eventModel.create({ text: message, tgId: from.id });
        ctx.reply('Got the message...');
    } catch (error) {
        ctx.reply('facing deficulty...');
        console.log(error);
    }
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))


// SocioTarBot
// Done! Congratulations on your new bot. You will find it at t.me/SocioTarBot. You can now add a description, about section and profile picture for your bot, see /help for a list of commands. By the way, when you've finished creating your cool bot, ping our Bot Support if you want a better username for it. Just make sure the bot is fully operational before you do this.

// Use this token to access the HTTP API:
// 6873436336:AAFodmHKAqYFIZuog5mcjvx-hm6tO-ntOy0
// Keep your token secure and store it safely, it can be used by anyone to control your bot.

// For a description of the Bot API, see this page: https://core.telegram.org/bots/api