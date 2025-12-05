namespace DiscordRPCEditor
{
    public sealed partial class MainWindow : Window
    {
        private DesktopAcrylicController acrylicController;
        private SystemBackdropConfiguration backdropConfig;
        private DiscordRpcClient client;

        public MainWindow()
        {
            this.InitializeComponent();
            this.ExtendsContentIntoTitleBar = true;
            TrySetAcrylicBackdrop();
            this.Title = "Discord RPCEditor";
            this.AppWindow.Resize(new(800, 800));
            var presenter = this.AppWindow.Presenter as Microsoft.UI.Windowing.OverlappedPresenter;
            if (presenter != null)
            {
                presenter.IsResizable = false;
                presenter.IsMaximizable = false;
            }
        }

        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            SetTitleBar();
        }

        private void SetTitleBar()
        {
            var titleBar = Microsoft.UI.Xaml.Window.Current.AppWindow.TitleBar;
            if (titleBar != null)
            {
                titleBar.BackgroundColor = Microsoft.UI.Colors.Transparent; 
                titleBar.ForegroundColor = Microsoft.UI.Colors.White;
                titleBar.ButtonBackgroundColor = Microsoft.UI.Colors.Transparent;
                titleBar.ButtonForegroundColor = Microsoft.UI.Colors.White;
            }
        }

        private void TrySetAcrylicBackdrop()
        {
            if (DesktopAcrylicController.IsSupported())
            {
                acrylicController = new DesktopAcrylicController();
                backdropConfig = new SystemBackdropConfiguration();

                this.Activated += Window_Activated;
                this.Closed += Window_Closed;
                ((FrameworkElement)this.Content).ActualThemeChanged += Window_ThemeChanged;

                backdropConfig.IsInputActive = true;
                SetBackdropTheme();

                acrylicController.AddSystemBackdropTarget(this.As<ICompositionSupportsSystemBackdrop>());
                acrylicController.SetSystemBackdropConfiguration(backdropConfig);
            }
        }

        private void Window_Activated(object sender, WindowActivatedEventArgs args)
        {
            backdropConfig.IsInputActive = args.WindowActivationState != WindowActivationState.Deactivated;
        }

        private void Window_Closed(object sender, WindowEventArgs args)
        {
            if (acrylicController != null)
            {
                acrylicController.Dispose();
                acrylicController = null;
            }
            this.Activated -= Window_Activated;
            backdropConfig = null;
        }

        private void Window_ThemeChanged(FrameworkElement sender, object args)
        {
            if (backdropConfig != null)
            {
                SetBackdropTheme();
            }
        }

        private void SetBackdropTheme()
        {
            switch (((FrameworkElement)this.Content).ActualTheme)
            {
                case ElementTheme.Dark:
                    backdropConfig.Theme = SystemBackdropTheme.Dark;
                    break;
                case ElementTheme.Light:
                    backdropConfig.Theme = SystemBackdropTheme.Light;
                    break;
                case ElementTheme.Default:
                    backdropConfig.Theme = SystemBackdropTheme.Default;
                    break;
            }
        }

        private void BtnConnect_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtClientID.Text)) return;
            client = new DiscordRpcClient(txtClientID.Text);
            client.Logger = new ConsoleLogger() { Level = LogLevel.Warning };
            client.Initialize();
            UpdatePresence();
            txtClientID.IsEnabled = false;
        }


        private void BtnDisconnect_Click(object sender, RoutedEventArgs e)
        {
            client?.Dispose();
            client = null;
            txtClientID.IsEnabled = true;
        }

        private void UpdatePresence()
        {
            if (client == null) return;
            var presence = new RichPresence
            {
                State = txtState.Text,
                Details = txtDetails.Text,
                Assets = new Assets
                {
                    LargeImageKey = txtLargeImageKey.Text,
                    LargeImageText = txtLargeImageText.Text,
                    SmallImageKey = txtSmallImageKey.Text,
                    SmallImageText = txtSmallImageText.Text
                },
                Buttons = GetButtons(),
                Party = chkParty.IsChecked == true ? new Party
                {
                    ID = txtPartyID.Text,
                    Size = int.TryParse(txtPartySize.Text, out var s) ? s : 0,
                    Max = int.TryParse(txtPartyMax.Text, out var m) ? m : 0
                } : null,
                Timestamps = chkTimestamp.IsChecked == true ? Timestamps.Now : null
            };
            client.SetPresence(presence);
        }

        private void SetInputEnabled(bool enabled)
        {
            txtClientID.IsEnabled = enabled;
            txtState.IsEnabled = enabled;
            txtDetails.IsEnabled = enabled;
            txtLargeImageKey.IsEnabled = enabled;
            txtLargeImageText.IsEnabled = enabled;
            txtSmallImageKey.IsEnabled = enabled;
            txtSmallImageText.IsEnabled = enabled;
            chkTimestamp.IsEnabled = enabled;
            chkParty.IsEnabled = enabled;
            txtPartyID.IsEnabled = enabled;
            txtPartySize.IsEnabled = enabled;
            txtPartyMax.IsEnabled = enabled;
        }

        private DiscordRPC.Button[] GetButtons()
        {
            var list = new List<DiscordRPC.Button>();
            if (!string.IsNullOrWhiteSpace(txtButton1Label.Text) &&
                Uri.IsWellFormedUriString(txtButton1Url.Text, UriKind.Absolute))
                list.Add(new DiscordRPC.Button { Label = txtButton1Label.Text, Url = txtButton1Url.Text });
            if (!string.IsNullOrWhiteSpace(txtButton2Label.Text) &&
                Uri.IsWellFormedUriString(txtButton2Url.Text, UriKind.Absolute))
                list.Add(new DiscordRPC.Button { Label = txtButton2Label.Text, Url = txtButton2Url.Text });
            return list.ToArray();
        }
    }
}
