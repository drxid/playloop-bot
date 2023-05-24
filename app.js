import { Telegraf } from 'telegraf'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const botToken = process.env.TELEGRAM_BOT_TOKEN
const bot = new Telegraf(botToken)
const mongoURL = process.env.MONGODB_URL

mongoose
  .connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err))

const accessDataSchema = new mongoose.Schema({
  userId: Number,
  nickname: String,
})

const AccessData = mongoose.model('AccessData', accessDataSchema)

bot.command('get-access', (ctx) => {
  const chatId = ctx.chat.id
  const userId = ctx.from.id

  ctx.reply('Пожалуйста, пришлите свой ник на сайте:')
})

bot.on('message', (ctx) => {
  const chatId = ctx.chat.id
  const userId = ctx.from.id
  const nickname = ctx.message.text

  const accessData = new AccessData({ userId, nickname })

  accessData
    .save()
    .then(() => {
      ctx.reply('Ваши данные доступа были сохранены.')
    })
    .catch((err) => {
      console.error('Ошибка при сохранении данных в MongoDB:', err)
      ctx.reply('Извините, что-то пошло не так.')
    })
})

bot.launch()
