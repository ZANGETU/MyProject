namespace Minecraft_Potion_Editor
{
    public partial class Form1 : MetroForm
    {
        private DiscordRpc.EventHandlers handlers;
        private DiscordRpc.RichPresence presence;
        public Form1()
        {
            InitializeComponent();
            textBox4.Enabled = false;
            button4.Enabled = false;
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            System.Media.SoundPlayer simpleSound = new System.Media.SoundPlayer("sound\\popopo.wav");
            simpleSound.Play();
            MessageBox.Show("Welcome To Potion Editor", "Minecraft Potion Editor", MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
            this.metroComboBox1.SelectedIndex = 0;
            this.metroComboBox2.SelectedIndex = 0;
            metroComboBox1.DropDownStyle = ComboBoxStyle.DropDownList;
            metroComboBox2.DropDownStyle = ComboBoxStyle.DropDownList;
            this.handlers = default(DiscordRpc.EventHandlers);
            DiscordRpc.Initialize("", ref this.handlers, true, null);
            this.handlers = default(DiscordRpc.EventHandlers);
            this.presence.details = "";
            this.presence.state = "";
            DateTime d = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            long startTimestamp = (long)(DateTime.UtcNow - d).TotalSeconds;
            this.presence.startTimestamp = startTimestamp;
            this.presence.largeImageKey = "";
            this.presence.smallImageKey = "";
            this.presence.largeImageText = "";
            this.presence.smallImageText = "";
            DiscordRpc.UpdatePresence(ref this.presence);
        }

        private void groupBox2_Enter(object sender, EventArgs e)
        {

        }

        private void button1_Click(object sender, EventArgs e)
        {
            richTextBox1.Clear();
            string potionType = this.metroComboBox1.SelectedItem.ToString();
            string hideFlags = this.metroComboBox2.SelectedItem.ToString();
            string potionCommand;
            if (potionType == "普通のポーション")
            {
                potionCommand = "potion";
            }
            else if (potionType == "スプラッシュポーション")
            {
                potionCommand = "splash_potion";
            }
            else if (potionType == "残留ポーション")
            {
                potionCommand = "lingering_potion";
            }
            else if (potionType == "効果付きの矢")
            {
                potionCommand = "tipped_arrow";
            }
            else
            {
                potionCommand = "potion";
            }
            this.richTextBox1.AppendText($"/give @s minecraft:{potionCommand}{{");
            if (checkBox21.Checked)
            {
                this.richTextBox1.AppendText($"CustomPotionColor:{textBox4.Text},");
            }

            string potionName = textBox2.Text;
            string effectsOutput = GenerateEffects();
            this.richTextBox1.AppendText($"display:{{Name:\"\\\"{potionName}\\\"\",Lore:[\"\\\"{textBox3.Text}\\\"\"]}},CustomPotionEffects:[{effectsOutput}]}} {numericUpDown1.Value}");
        }



        private string GenerateEffects()
        {
            List<string> effects = new List<string>();
            AppendEffect(1, numericUpDown2, numericUpDown19, checkBox1, effects); //移動速度上昇
            AppendEffect(2, numericUpDown3, numericUpDown18, checkBox2, effects); //移動速度低下
            AppendEffect(3, numericUpDown5, numericUpDown17, checkBox4, effects); //採掘速度上昇
            AppendEffect(4, numericUpDown4, numericUpDown16, checkBox3, effects); //採掘速度低下
            AppendEffect(5, numericUpDown7, numericUpDown15, checkBox8, effects); //攻撃力上昇
            AppendEffect(6, numericUpDown6, numericUpDown14, checkBox7, effects); //即時回復
            AppendEffect(7, numericUpDown9, numericUpDown13, checkBox5, effects); //即時ダメージ
            AppendEffect(8, numericUpDown8, numericUpDown12, checkBox6, effects); //跳躍力上昇
            AppendEffect(9, numericUpDown10, numericUpDown11, checkBox9, effects); //吐き気
            AppendEffect(20, numericUpDown41, numericUpDown40, checkBox20, effects); //衰弱
            AppendEffect(10, numericUpDown37, numericUpDown28, checkBox18, effects); //再生能力
            AppendEffect(11, numericUpDown36, numericUpDown27, checkBox17, effects); //耐性
            AppendEffect(12, numericUpDown35, numericUpDown26, checkBox15, effects); //火炎耐性
            AppendEffect(13, numericUpDown34, numericUpDown25, checkBox16, effects); //水中呼吸
            AppendEffect(14, numericUpDown33, numericUpDown24, checkBox14, effects); //透明化
            AppendEffect(15, numericUpDown32, numericUpDown23, checkBox11, effects); //盲目
            AppendEffect(16, numericUpDown31, numericUpDown22, checkBox17, effects); //暗視
            AppendEffect(17, numericUpDown30, numericUpDown21, checkBox18, effects); //空腹
            AppendEffect(18, numericUpDown29, numericUpDown20, checkBox19, effects); //弱体化
            AppendEffect(19, numericUpDown39, numericUpDown38, checkBox20, effects); //毒
            return effects.Count > 0 ? string.Join(",", effects) : "";
        }


        private void AppendEffect(int id, NumericUpDown amplifier, NumericUpDown duration, CheckBox checkBox, List<string> effects)
        {
            if (checkBox.Checked)
            {
                string effect = $"{{Id:{id},Amplifier:{amplifier.Value - 1},Duration:{duration.Value * 20}";
                string particlesOption = metroComboBox2.SelectedItem.ToString();
                if (particlesOption == "非表示")
                {
                    effect += ",ShowParticles:false";
                }
                effect += "}";
                effects.Add(effect);
            }
        }

        private void checkBox21_CheckedChanged(object sender, EventArgs e)
        {
            textBox4.Enabled = false;
            button4.Enabled = false;
            if (checkBox21.Checked)
            {
                textBox4.Enabled = true;
                button4.Enabled = true;
            }
            else
            {
                textBox4.Enabled = false;
                button4.Enabled = false;
            }
        }

        private void button2_Click(object sender, EventArgs e)
        {
            bool flag = this.richTextBox1.Text.Length == 0;
            if (flag)
            {
                MessageBox.Show("コピーできませんでした", "Minecraft Potion Editor", MessageBoxButtons.OK, MessageBoxIcon.Exclamation);
            }
            else
            {
                Clipboard.SetText(this.richTextBox1.Text);
                MessageBox.Show("コピーしました", "Minecraft Potion Editor");
            }
        }

        private void button3_Click(object sender, EventArgs e)
        {
            richTextBox1.SaveFile(@"command.txt", RichTextBoxStreamType.PlainText);
            MessageBox.Show("出力に成功しました", "Minecraft Potion Editor");
        }

        private void linkLabel1_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            System.Diagnostics.Process.Start("");
        }

        private void linkLabel2_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            System.Diagnostics.Process.Start("");
        }

        private void button4_Click(object sender, EventArgs e)
        {
            using (ColorDialog colorDialog = new ColorDialog())
            {
                if (colorDialog.ShowDialog() == DialogResult.OK)
                {
                    Color selectedColor = colorDialog.Color;
                    int colorCode = (selectedColor.R << 16) | (selectedColor.G << 8) | selectedColor.B;
                    textBox4.Text = colorCode.ToString();
                }
            }
        }

        private void button5_Click(object sender, EventArgs e)
        {
            richTextBox1.ResetText();
        }
    }
}

//©2024 YURIRI
