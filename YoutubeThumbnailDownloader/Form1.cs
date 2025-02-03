namespace YouTube_thumbnail_Save
{
    public partial class Form1 : Form
    {
        private readonly YouTubeService _youTubeService;
        public Form1()
        {
            InitializeComponent();
            _youTubeService = new YouTubeService(new BaseClientService.Initializer()
            {
                ApiKey = "Your Key",
                ApplicationName = "YoutubeThumbnailDownloader"
            });
        }

        private void pictureBox1_Click(object sender, EventArgs e)
        {
        }

        private async void button1_Click(object sender, EventArgs e)
        {
            string link = textBox1.Text;
            string videoId = GetVideoId(link);
            if (string.IsNullOrEmpty(videoId))
            {
                MessageBox.Show("YouTubeリンクが無効です","エラー");
                return;
            }
            string thumbnailUrl = await GetThumbnailUrl(videoId);
            pictureBox1.Load(thumbnailUrl);
        }

        private string GetVideoId(string link)
        {
            int index = link.IndexOf("?v=");
            if (index == -1)
            {
                return "";
            }
            string videoId = link.Substring(index + 3);
            index = videoId.IndexOf("&");
            if (index != -1)
            {
                videoId = videoId.Substring(0, index);
            }
            return videoId;
        }

        private async Task<string> GetThumbnailUrl(string videoId)
        {
            var videoListRequest = _youTubeService.Videos.List("snippet");
            videoListRequest.Id = videoId;
            videoListRequest.MaxResults = 1;
            videoListRequest.Fields = "items(snippet(thumbnails(maxres)))";
            var videoListResponse = await videoListRequest.ExecuteAsync();
            if (videoListResponse.Items.Count > 0)
            {
                return videoListResponse.Items[0].Snippet.Thumbnails.Maxres.Url;
            }
            return "";
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
        }

        private void button2_Click(object sender, EventArgs e)
        {
            SaveFileDialog sfd = new SaveFileDialog();
            sfd.Filter = "PNG形式|*.png|JPEG形式|*.jpeg|すべてのファイル|*.*";
            sfd.FilterIndex = 1;
            sfd.Title = "画像を保存する";
            if (sfd.ShowDialog() == DialogResult.OK)
            {
                pictureBox1.Image.Save(sfd.FileName, System.Drawing.Imaging.ImageFormat.Jpeg);
            }
            else
            {
                MessageBox.Show("保存する画像がありません。", "エラー", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}

//By YURIRI
