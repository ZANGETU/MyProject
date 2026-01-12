namespace MinecraftSkinpackEditor
{
    public partial class Form1 : MetroForm
    {
        private List<Skin> skins = new List<Skin>();
        private string textsFolder = Path.Combine(Directory.GetCurrentDirectory(), "texts");
        private ImageList imageList = new ImageList();

        public Form1()
        {
            InitializeComponent();
            Directory.CreateDirectory(textsFolder);

            //ImageListの設定
            imageList.ImageSize = new System.Drawing.Size(64, 64);
            imageList.ColorDepth = ColorDepth.Depth32Bit;
            metroListView1.LargeImageList = imageList;

            //ListViewの設定
            metroListView1.View = View.LargeIcon;
            metroListView1.LargeImageList = imageList;
        }

        private void metroButton1_Click(object sender, EventArgs e)
        {
            OpenFileDialog openFileDialog = new OpenFileDialog();
            openFileDialog.Filter = "PNG Files (*.png)|*.png";

            if (openFileDialog.ShowDialog() == DialogResult.OK)
            {
                string fileName = Path.GetFileName(openFileDialog.FileName);
                string destPath = Path.Combine(Directory.GetCurrentDirectory(), fileName);

                File.Copy(openFileDialog.FileName, destPath, true);
                skins.Add(new Skin { texture = fileName });

                using (var stream = new FileStream(destPath, FileMode.Open, FileAccess.Read))
                {
                    Image img = Image.FromStream(stream);
                    imageList.Images.Add(fileName, img);
                }
                ListViewItem item = new ListViewItem
                {
                    Text = fileName,
                    Tag = skins.Count - 1,
                    ImageKey = fileName
                };
                metroListView1.Items.Add(item);
            }
        }

        private void metroButton1_Click_1(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(txtName.Text) ||
                string.IsNullOrEmpty(txtUUID.Text) ||
                string.IsNullOrEmpty(txtUUID2.Text))
            {
                MessageBox.Show("pack name, UUID_1, UUID_2いずれかが未入力です", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            string manifestContent = CreateManifest();
            File.WriteAllText("manifest.json", manifestContent);
            string skinsContent = CreateSkinsJson();
            File.WriteAllText("skins.json", skinsContent);
            string langFilePath = Path.Combine(Directory.GetCurrentDirectory(), "texts", "en_US.lang");
            string packLine = $"skinpack.{txtName.Text}={txtName.Text}";
            File.AppendAllText(langFilePath, packLine + Environment.NewLine);
            CreateMcPack();
        }

        private string CreateManifest()
        {
            var manifest = new
            {
                format_version = 2,
                header = new
                {
                    name = txtName.Text,
                    uuid = txtUUID.Text,
                    version = new[] { 1, 0, 0 }
                },
                modules = new[]
                {
                    new
                    {
                        type = "skin_pack",
                        uuid = txtUUID2.Text,
                        version = new[] { 1, 0, 0 }
                    }
                }
            };
            return JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true });
        }

        private string CreateSkinsJson()
        {
            var skinsJson = new
            {
                serialize_name = txtName.Text.ToLower().Replace(" ", "_"),
                localization_name = txtName.Text,
                skins = skins
            };
            return JsonSerializer.Serialize(skinsJson, new JsonSerializerOptions { WriteIndented = true });
        }

        private void CreateMcPack()
        {
            string zipPath = $"{txtName.Text}.mcpack";
            string langFilePath = Path.Combine(textsFolder, "en_US.lang");
            string tempLangFilePath = langFilePath + ".tmp";
            if (File.Exists(langFilePath))
            {
                File.Move(langFilePath, tempLangFilePath);
            }
            File.WriteAllText(langFilePath, string.Empty);
            string packLine = $"skinpack.{txtName.Text}={txtName.Text}";
            File.AppendAllText(langFilePath, packLine + Environment.NewLine);
            foreach (Skin skin in skins)
            {
                string line = $"skin.{txtName.Text}.{skin.localization_name}={skin.localization_name}";
                File.AppendAllText(langFilePath, line + Environment.NewLine);
            }
            if (File.Exists(zipPath))
            {
                File.Delete(zipPath);
            }
            using (ZipArchive archive = ZipFile.Open(zipPath, ZipArchiveMode.Create))
            {
                archive.CreateEntryFromFile("manifest.json", "manifest.json");
                archive.CreateEntryFromFile("skins.json", "skins.json");

                string[] textFiles = Directory.GetFiles(textsFolder);
                foreach (string file in textFiles)
                {
                    archive.CreateEntryFromFile(file, Path.Combine("texts", Path.GetFileName(file)));
                }
                foreach (Skin skin in skins)
                {
                    string texturePath = Path.Combine(Directory.GetCurrentDirectory(), skin.texture);
                    if (File.Exists(texturePath))
                    {
                        archive.CreateEntryFromFile(texturePath, skin.texture);
                    }
                }
            }
            if (File.Exists(tempLangFilePath))
            {
                File.Delete(langFilePath);
                File.Move(tempLangFilePath, langFilePath);
            }
            MessageBox.Show("スキンパックが正常に作成されました！", "成功", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void metroListView1_MouseDoubleClick(object sender, MouseEventArgs e)
        {
            if (metroListView1.SelectedItems.Count > 0)
            {
                int index = (int)metroListView1.SelectedItems[0].Tag;
                Skin skin = skins[index];
                using (Form2 form2 = new Form2(skin, txtName.Text))
                {
                    if (form2.ShowDialog() == DialogResult.OK)
                    {
                        skins[index] = form2.Skin;
                        string langFilePath = Path.Combine(textsFolder, "en_US.lang");
                        string line = $"skin.{txtName.Text}.{form2.Skin.localization_name}={form2.Skin.localization_name}";
                        File.AppendAllText(langFilePath, line + Environment.NewLine);
                    }
                }
            }
        }

        private void metroButton2_Click(object sender, EventArgs e)
        {
            if (metroListView1.SelectedItems.Count > 0)
            {
                int index = (int)metroListView1.SelectedItems[0].Tag;
                Skin skin = skins[index];
                skins.RemoveAt(index);
                metroListView1.Items.RemoveAt(metroListView1.SelectedIndices[0]);
                imageList.Images.RemoveByKey(skin.texture);
                string langFilePath = Path.Combine(Directory.GetCurrentDirectory(), "texts", "en_US.lang");
                var lines = File.ReadAllLines(langFilePath).Where(line => !line.Contains($"skin.{txtName.Text}.{skin.localization_name}")).ToList();
                File.WriteAllLines(langFilePath, lines);
            }
        }

        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            foreach (var skin in skins)
            {
                try
                {
                    string fullPath = Path.Combine(Directory.GetCurrentDirectory(), skin.texture);
                    File.Delete(fullPath);
                }
                catch (IOException ex)
                {
                    MessageBox.Show($"Error deleting file: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private void linkLabel1_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            System.Diagnostics.Process.Start("");
        }

        private void metroButton3_Click(object sender, EventArgs e)
        {
            Form3 form = new Form3();
            form.ShowDialog();
        }
    }

    public class Skin
    {
        public string localization_name { get; set; }
        public string geometry { get; set; } = "geometry.humanoid.custom";
        public string texture { get; set; }
        public string type { get; set; } = "free";
    }
}
