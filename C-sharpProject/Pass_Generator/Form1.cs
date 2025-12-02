namespace Pass_Generator
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();

            for (int i = 2; i <= 30; i += 2)
            {
                comboBox1.Items.Add(i);
            }

            //comboBox2に追加
            comboBox2.Items.Add("小文字");
            comboBox2.Items.Add("大文字");
            comboBox2.Items.Add("小文字・大文字");
            comboBox2.Items.Add("数字");
            comboBox2.Items.Add("小文字・大文字・数字");
            comboBox2.Items.Add("小文字・大文字・数字・記号");
            comboBox1.DropDownStyle = ComboBoxStyle.DropDownList;
            comboBox2.DropDownStyle = ComboBoxStyle.DropDownList;
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
        }

        private void button1_Click(object sender, EventArgs e)
        {
            if (comboBox1.SelectedItem == null || comboBox2.SelectedItem == null)
            {
                MessageBox.Show("文字数とレベルを選択してください", "エラー", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            int length = (int)comboBox1.SelectedItem;
            string level = comboBox2.SelectedItem.ToString();
            string password = GeneratePassword(length, level);
            textBox1.Text = password;
        }

        private string GeneratePassword(int length, string level)
        {
            //パスワードの種類を定義
            string lowercase = "abcdefghijklmnopqrstuvwxyz";
            string uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            string numbers = "0123456789";
            string symbols = "!@#$%^&*()-_+=~`[]{}|;:,.<>?";

            StringBuilder validChars = new StringBuilder();
            if (level.Contains("小文字"))
                validChars.Append(lowercase);
            if (level.Contains("大文字"))
                validChars.Append(uppercase);
            if (level.Contains("数字"))
                validChars.Append(numbers);
            if (level.Contains("記号"))
                validChars.Append(symbols);
            StringBuilder password = new StringBuilder();
            Random random = new Random();
            for (int i = 0; i < length; i++)
            {
                password.Append(validChars[random.Next(0, validChars.Length)]);
            }
            return password.ToString();
        }
    }
}
//作成:YURIRI
