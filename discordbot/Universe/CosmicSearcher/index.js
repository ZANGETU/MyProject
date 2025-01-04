const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
    .setName('nasa-search')
    .setDescription('NASAの画像を検索します')
    .addStringOption(option =>
        option
        .setName('query')
        .setDescription('検索ワードを入力してください')
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
        console.log('コマンドの読み込みに成功しました');
    } catch (error) {
        console.error(error);
    }
})();
const sanitizeHtml = (html) => html.replace(/<\/?[^>]+(>|$)/g, ''); 
client.once('ready', () => {
    console.log(`${client.user.tag}がログインしました`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName === 'nasa-search') {
        const query = interaction.options.getString('query');
        const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`;
        await interaction.deferReply();
        try {
            const response = await axios.get(url);
            const data = response.data;
            if (!data.collection || data.collection.items.length === 0) {
                return await interaction.editReply(`**${query}** に一致する画像が見つかりませんでした`);
            }
            const items = data.collection.items.slice(0, 5);
            let currentIndex = 0;
            const embeds = items.map(item => {
                const title = item.data[0]?.title || 'タイトルなし';
                const description = sanitizeHtml(item.data[0]?.description || '説明なし');
                const imageUrl = item.links[0]?.href;
                const photographer = item.data[0]?.photographer || '不明';
                const dateCreated = item.data[0]?.date_created ? new Date(item.data[0]?.date_created).toLocaleDateString() : '不明';
                return new EmbedBuilder()
                .setTitle(title)
                    .setDescription(description)
                    .setImage(imageUrl)
                    .setURL(imageUrl)
                    .setColor(0x1d2951)
                    .addFields(
                        { name: '撮影日', value: dateCreated, inline: true },
                        { name: '撮影者', value: photographer, inline: true }
                    )
                    .setFooter({ text: `提供元:NASA Image and Video Library | ページ ${items.indexOf(item) + 1}/${items.length}` });
                });
            //ボタン
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('⬅️ 前へ')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('➡️ 次へ')
                    .setStyle(ButtonStyle.Primary)
            );
            const message = await interaction.editReply({ embeds: [embeds[currentIndex]], components: [row] });
            const filter = i => i.customId === 'prev' || i.customId === 'next';
            const collector = message.createMessageComponentCollector({ filter, time: 600000 });
            collector.on('collect', async i => {
                if (i.customId === 'prev') {
                    currentIndex = (currentIndex - 1 + embeds.length) % embeds.length; 
                } else if (i.customId === 'next') {
                    currentIndex = (currentIndex + 1) % embeds.length;
                }
                await i.update({ embeds: [embeds[currentIndex]], components: [row] });
            });
            collector.on('end', () => {
                message.edit({ components: [] });
            });
        } catch (error) {
            console.error('画像取得中にエラーが発生しました:', error);
            await interaction.editReply('画像取得中にエラーが発生しました');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
