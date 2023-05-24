import { Telegraf, Markup } from 'telegraf'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const botToken = process.env.TELEGRAM_BOT_TOKEN
const mongoURL = process.env.MONGODB_URL

const bot = new Telegraf(botToken)

mongoose
  .connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((e) => {
    console.error('Error connecting to MongoDB:', e)
    process.exit(1)
  })

const accessDataSchema = new mongoose.Schema({
  userId: Number,
  nickname: String,
  date: Date,
})

const AccessData = mongoose.model('AccessData', accessDataSchema)

bot.command('start', (ctx) => {
  const subscriptionButton = Markup.inlineKeyboard([
    Markup.button.callback('Проверить подписку', 'check_subscription'),
  ])

  ctx.reply(
    `👋 Здравствуйте
Мы будем рады записать вас на бета-тестирование нашего приложения и поделиться с вами промокодом
Необходимо только подписаться на наш телеграм канал @PlayloopApp, и нажать кнопку 👇`,
    subscriptionButton
  )
})

bot.action('check_subscription', async (ctx) => {
  const userId = ctx.from.id
  const channelUsername = process.env.CHANNEL_USERNAME

  try {
    const chatMember = await ctx.getChatMember(userId, channelUsername)

    if (chatMember && chatMember.status === 'member') {
      await ctx.reply('Спасибо за подписку на @PlayloopApp!')

      await ctx.reply(`🥳 Ура! Промокод уже ваш!
Промокод: WINTERGREEN
Вам доступно 3 дня бесплатной подписки Flash, доступ к озвучке сюжетных приключений настольных игр и к всем коллекциям звуков в Миксере ⚡️📦

Вы сможете воспользоватся промокодом сразу после получения бета доступа к приложению.`)

      await ctx.reply(`☕️ Пара шагов до тестирования атмосферных партий
Для записи на бета-тест, пришлите свой ник/почту на сайте в ответном сообщении`)

      bot.on('message', async (ctx) => {
        const userId = ctx.from.id
        const nickname = ctx.message.text
        const currentDate = Date.now()

        if (chatMember && chatMember.status === 'member') {
          try {
            const existingUser = await AccessData.findOne({ userId })

            if (existingUser) {
              const timeDiffMinutes = (currentDate - existingUser.date) / (1000 * 60)

              if (timeDiffMinutes >= 2) {
                existingUser.nickname = nickname
                existingUser.date = currentDate
                await existingUser.save()
                ctx.reply('Ваши данные доступа были обновлены.')
              } else {
                ctx.reply('Данные нельзя обновлять чаще 2 минут! Попробуйте попозже.')
              }
              
            } else {
              const accessData = new AccessData({ userId, nickname, currentDate })
              await accessData.save()

              ctx.reply(`Ваши данные доступа были сохранены, периодически мы добавляем новых пользователей для тестирования и вы уже в очереди!
Оставайтесь на связи, мы скоро вам напишем! 🎲⚔️⭐🏹🛡️🦂🐉`)
            }
          } catch (e) {
            console.error('Error on saving in MongoDB:', e)
            ctx.reply('Извините, что-то пошло не так.')
          }
        }
      })
    } else {
      await ctx.reply(`💁‍♂️ Подпишитесь на канал
Чтобы получить промокод и записаться на бета-тест, необходимо подписаться на наш телеграм канал @PlayloopApp`)
    }
  } catch (e) {
    console.error('Error checking subscription:', e)
    ctx.reply('Извините, что-то пошло не так при проверке вашей подписки на наш телеграм канал @PlayloopApp')
  }
})

bot.launch().catch((e) => {
  console.error('Error starting the bot:', e)
  process.exit(1)
})
