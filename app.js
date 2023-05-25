import { Telegraf, Markup } from 'telegraf'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import AccessData from './schema/accessDataSchema.js'
import texts from './data/texts.json' assert { type: 'json' }

dotenv.config()

const botToken = process.env.TELEGRAM_BOT_TOKEN
const mongoURL = process.env.MONGODB_URL
const channelUsername = process.env.CHANNEL_USERNAME

const bot = new Telegraf(botToken)

mongoose
  .connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((e) => {
    console.error('Error connecting to MongoDB:', e)
    process.exit(1)
  })

bot.command('start', (ctx) => {
  const subscriptionButton = Markup.inlineKeyboard([
    Markup.button.callback(texts.buttonCheckSub, 'check_subscription'),
  ])

  ctx.reply(texts.hello, subscriptionButton)
})

bot.action('check_subscription', async (ctx) => {
  try {
    const userId = ctx.from.id
    const chatMember = await ctx.getChatMember(userId, channelUsername)

    if (chatMember && chatMember.status === 'member') {
      await ctx.reply(texts.thanksForSub)
      await ctx.reply(texts.givePromo)
      await ctx.reply(texts.signUpForTesting)

      bot.on('message', async (ctx) => {
        const userId = ctx.from.id
        const nickname = ctx.message.text
        const currentDate = new Date()

        const existingUser = await AccessData.findOne({ userId })

        const addInfoToDB = async () => {
          try {
            if (!existingUser) {
              const accessData = new AccessData({ userId, nickname, currentDate })
              await accessData.save()
              ctx.reply(texts.signUpForTestingDone)
              return
            }

            const timeDiffMinutes = Math.floor((new Date() - existingUser.currentDate) / 1000 / 60)
            if (timeDiffMinutes >= 2) {
              existingUser.nickname = nickname
              existingUser.currentDate = new Date()
              await existingUser.save()
              ctx.reply(texts.dataUpdated)
            } else {
              ctx.reply(texts.timeout)
            }

          } catch (e) {
            console.error('Error on saving in MongoDB:', e)
            ctx.reply(texts.errBase)
          }
        }

        addInfoToDB()
      })
    } else {
      await ctx.reply(texts.dontSub)
    }
  } catch (e) {
    console.error('Error checking subscription:', e)
    ctx.reply(texts.errSub)
  }
})

bot.launch().catch((e) => {
  console.error('Error starting the bot:', e)
  process.exit(1)
})
