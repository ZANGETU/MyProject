const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('mars-search')
        .setDescription('指定した火星探査機の写真を取得します')
        .addStringOption(option =>
            option
            .setName('rover')
            .setDescription('火星探査機を選択してください')
            .setRequired(true)
            .addChoices(
                { name: 'Curiosity', value: 'curiosity' },
                { name: 'Opportunity', value: 'opportunity' },
                { name: 'Spirit', value: 'spirit' }
            )
        )
        .addStringOption(option =>
            option
            .setName('date')
            .setDescription('撮影日(YYYY-MM-DD)を入力してください')
            .setRequired(true)
        )
].map(command => command.toJSON());
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('コマンドが正常に読み込まれました');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log(`${client.user.tag}がログインしました`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'mars-search') {
        const rover = interaction.options.getString('rover'); //火星探査機
        const earthDate = interaction.options.getString('date'); //撮影日
        const apiKey = process.env.NASA_API_KEY;
        const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?earth_date=${earthDate}&api_key=${apiKey}`;
        await interaction.deferReply();
        try {
            const response = await axios.get(url);
            const photos = response.data.photos;
            if (photos.length === 0) {
                return await interaction.editReply('この日付の写真が見つかりませんでした');
            }
            const photo = photos[0]; //写真
            const imageUrl = photo.img_src; //画像
            const camera = photo.camera.name; //撮影したカメラ名
            const sol = photo.sol; //火星経過日数
            const earthDatePhoto = photo.earth_date; //地球での撮影日時
            const embed = new EmbedBuilder()
                .setTitle(`${rover.charAt(0).toUpperCase() + rover.slice(1)} - ${earthDatePhoto} の写真`)
                .setDescription(`撮影カメラ: ${camera}\n火星の日数(Sol): ${sol}`)
                .setImage(imageUrl)
                .setURL(imageUrl)
                .setColor(0x1d2951)
                .setFooter({ text: '提供:NASA Mars Rover Photos API' });
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('画像取得エラー', error);
            await interaction.editReply('画像取得エラー');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
