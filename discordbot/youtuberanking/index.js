require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { google } = require('googleapis');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

//YouTubeApiの設定
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

const clientId = process.env.CLIENT_ID;
const botToken = process.env.DISCORD_TOKEN;
client.login(botToken);
client.once('ready', async () => {
  console.log(`${client.user.tag} has logged in!`);

  //スラッシュコマンドの設定
  const commands = [
    new SlashCommandBuilder()
      .setName('trending')
      .setDescription('YouTube急上昇ランキングを表示します')
      .addIntegerOption(option =>
        option.setName('rank')
          .setDescription('ランキングの番号(1〜10)')
          .setRequired(false)
          .addChoices(
            { name: '1', value: 1 },
            { name: '2', value: 2 },
            { name: '3', value: 3 },
            { name: '4', value: 4 },
            { name: '5', value: 5 },
            { name: '6', value: 6 },
            { name: '7', value: 7 },
            { name: '8', value: 8 },
            { name: '9', value: 9 },
            { name: '10', value: 10 }
          )),
  ]
  .map(command => command.toJSON());
  try {
    await client.application.commands.set(commands);
    console.log('コマンドが登録されました！');
  } catch (error) {
    console.error('コマンドの登録に失敗しました:', error);
  }
});

//コマンドの処理
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  const rank = interaction.options.getInteger('rank');

  if (commandName === 'trending') {
    try {
      //急上昇動画を取得
      const response = await youtube.videos.list({
        part: 'snippet,statistics',
        chart: 'mostPopular',
        regionCode: 'JP', //日本
        maxResults: 10,  //動画数
      })
      const embed = new EmbedBuilder()
        .setTitle('YouTube 急上昇ランキング')
        .setColor('#FF0000')
        .setDescription('YouTube急上昇ランキングの詳細です')
        .setTimestamp();
      if (rank) {
        const video = response.data.items[rank - 1]; //指定したランキングの動画を取得
        embed.setThumbnail(video.snippet.thumbnails.high.url)
          .addFields(
            {
              name: `${rank}位: ${video.snippet.title}(https://www.youtube.com/watch?v=${video.id})`,
              value: `視聴回数: ${video.statistics.viewCount} 回\nいいね数: ${video.statistics.likeCount || '不明'}\nコメント数: ${video.statistics.commentCount || '不明'}`,
              inline: false,
            }
          );

      } else {
        //ランキングを全て表示(視聴回数のみ)
        response.data.items.forEach((video, index) => {
          embed.addFields(
            {
              name: `${index + 1}位: ${video.snippet.title}(https://www.youtube.com/watch?v=${video.id})`,
              value: `視聴回数: ${video.statistics.viewCount} 回`, 
              inline: false,
            }
          );
        });
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('YouTubeAPIの取得エラー:', error);
      await interaction.reply('急上昇ランキングの取得に失敗しました');
    }
  }
});
