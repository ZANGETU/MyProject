namespace Minecraft_Test_Tool
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            comboBox1.DropDownStyle = ComboBoxStyle.DropDownList;
            comboBox2.DropDownStyle = ComboBoxStyle.DropDownList;
            this.comboBox1.SelectedIndex = 0;
            this.comboBox2.SelectedIndex = 0;
        }

        private void comboBox1_SelectedIndexChanged(object sender, EventArgs e)
        {
            comboBox2.Items.Clear();
            switch (comboBox1.SelectedItem.ToString()) 
            {
                case "項目を選択してください":
                    comboBox2.Items.Add("項目を選択してください");
                    break;

                case "構造物":
                    comboBox2.Items.Add("廃坑");
                    comboBox2.Items.Add("海底神殿");
                    comboBox2.Items.Add("草原の村");
                    comboBox2.Items.Add("埋もれた宝");
                    comboBox2.Items.Add("森の洋館");
                    break;
                case "バイオーム":
                    comboBox2.Items.Add("平原");
                    comboBox2.Items.Add("桜");
                    comboBox2.Items.Add("森林");
                    comboBox2.Items.Add("ジャングル");
                    comboBox2.Items.Add("砂漠");
                    break;
                default:
                    break;
            }
        }

        private void button1_Click(object sender, EventArgs e)
        {
            if(comboBox2.SelectedItem == null || string.IsNullOrWhiteSpace(comboBox2.SelectedItem.ToString()))
            {
                MessageBox.Show("適切な項目が選択されていません","エラー",MessageBoxButtons.OK,MessageBoxIcon.Error);
                return;
            }
            string selectedValue = comboBox2.SelectedItem.ToString();

            string a = this.comboBox1.SelectedItem.ToString();
            string a2 = this.comboBox2.SelectedItem.ToString();

            this.textBox1.Text = "/locate ";

            //combox1の内容
            bool flag1 = a == "構造物";
            bool flag2 = flag1;
            if (flag2)
            {
                this.textBox1.AppendText("structure ");
            }

            bool flag3 = a == "バイオーム";
            bool flag4 = flag3;
            if (flag4)
            {
                this.textBox1.AppendText("biome ");
            }

            //combox2の内容

            bool flag5 = a2 == "廃坑";
            bool flag6 = flag5;
            if (flag6)
            {
                this.textBox1.AppendText("mineshaft");
            }

            bool flag7 = a2 == "海底神殿";
            bool flag8 = flag7;
            if (flag8)
            {
                this.textBox1.AppendText("monument");
            }

            bool flag9 = a2 == "草原の村";
            bool flag10 = flag9;
            if (flag10)
            {
                this.textBox1.AppendText("village_plains");
            }

            bool flag11 = a2 == "埋もれた宝";
            bool flag12 = flag11;
            if (flag12)
            {
                this.textBox1.AppendText("buried_treasure");
            }

            bool flag13 = a2 == "森の洋館";
            bool flag14 = flag13;
            if (flag14)
            {
                this.textBox1.AppendText("mansion");
            }

            //バイオーム

            bool flag15 = a2 == "平原";
            bool flag16 = flag15;
            if (flag16)
            {
                this.textBox1.AppendText("plains");
            }

            bool flag17 = a2 == "桜";
            bool flag18 = flag17;
            if (flag18)
            {
                this.textBox1.AppendText("cherry_grove");
            }

            bool flag19 = a2 == "森林";
            bool flag20 = flag19;
            if (flag20)
            {
                this.textBox1.AppendText("forest");
            }

            bool flag21 = a2 == "ジャングル";
            bool flag22 = flag21;
            if (flag22)
            {
                this.textBox1.AppendText("jungle");
            }

            bool flag23 = a2 == "砂漠";
            bool flag24 = flag23;
            if (flag24)
            {
                this.textBox1.AppendText("desert");
            }
        }

        private void button2_Click(object sender, EventArgs e)
        {
            bool flag = this.textBox1.Text.Length == 0;
            if (flag)
            {
                MessageBox.Show("コピーできませんでした","エラー", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            else
            {
                Clipboard.SetText(this.textBox1.Text);
                MessageBox.Show("コピーしました","確認",MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }

        private void comboBox2_SelectedIndexChanged(object sender, EventArgs e)
        {
            if(comboBox2.SelectedItem == null)
            {
                MessageBox.Show("項目を選択してください");
            }
            else
            {
                string selectedValue = comboBox2.SelectedItem.ToString();
            }
        }
    }
}

//yuriri