namespace ColorSearch
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        //↓Colordialogから16進数とRGBを表示させる
        private void button1_Click(object sender, EventArgs e)
        {
            if (colorDialog1.ShowDialog() == DialogResult.OK)
            {
                Color selectedColor = colorDialog1.Color;
                string hexColor = $"#{selectedColor.R:X2}{selectedColor.G:X2}{selectedColor.B:X2}";
                textBox1.Text = hexColor;
                label1.Text = $"RGB({selectedColor.R}, {selectedColor.G}, {selectedColor.B})";
                pictureBox1.BackColor = selectedColor;
            }
        }

        //↓テキストボックスに入力されたカラーコード(16進数)をピクチャーボックスに表示させる
        private void button2_Click(object sender, EventArgs e)
        {
            try
            {
                string hexColor = textBox2.Text.TrimStart('#');
                Color color = ColorTranslator.FromHtml("#" + hexColor);
                pictureBox1.BackColor = color;
                label2.Text = $"RGB({color.R}, {color.G}, {color.B})";
            }
            catch (Exception ex)
            {
                MessageBox.Show($"無効なカラーコード: {ex.Message}", "エラー", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        //なんとなくformサイズ固定
        private void Form1_Load(object sender, EventArgs e)
        {
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
        }
    }
    //作成者YURIRI
}
