namespace MinecraftSkinpackEditor
{
    public partial class Form2 : MetroForm
    {
        public Skin Skin { get; private set; }
        private string packName;

        public Form2(Skin skin, string packName)
        {
            InitializeComponent();
            Skin = skin;
            txtSkinName.Text = skin.localization_name;
            metroComboBox1.SelectedItem = skin.geometry == "geometry.humanoid.customSlim" ? "Alex" : "Steve";
            try
            {
                string imagePath = Path.Combine(Directory.GetCurrentDirectory(), skin.texture);
                using (var stream = new FileStream(imagePath, FileMode.Open, FileAccess.Read))
                {
                    pictureBox1.Image = Image.FromStream(stream);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error loading image: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btnOk_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(txtSkinName.Text))
            {
                MessageBox.Show("Skin name cannot be empty.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            Skin.localization_name = txtSkinName.Text;
            Skin.geometry = metroComboBox1.SelectedItem.ToString() == "Alex" ? "geometry.humanoid.customSlim" : "geometry.humanoid.custom";
            DialogResult = DialogResult.OK;
        }
    }
}
