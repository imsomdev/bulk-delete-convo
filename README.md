# ChatGPT Bulk Delete Tool

A premium Chrome Extension to efficiently manage and bulk-delete your ChatGPT conversations with a modern user interface.

## 🚀 Features

- **Bulk Deletion**: Select multiple conversations and delete them all at once.
- **Select All / Deselect All**: Quickly manage your selection with a single click.
- **Background Processing**: Close the modal and continue deletion in the background.
- **Circular Progress**: Track deletion progress via a circular progress ring on the floating button.
- **Dark & Light Mode**: Seamless integration with system themes + manual toggle (Light, Dark, System).
- **Premium UI**: Custom confirmation modals and toast notifications (replaces native browser alerts).
- **Robust Detection**: Advanced logic to capture conversation titles even if ChatGPT updates its layout.

## 🛠 Installation

Currently, this extension is available for manual installation (Developer Mode):

1. **Download the code**: Clone this repository or download the ZIP file and extract it.
   ```bash
   git clone https://github.com/imsomdev/bulk-delete-convo.git
   ```
2. **Open Extensions Page**: In Chrome (or any Chromium browser like Edge/Brave), go to `chrome://extensions/`.
3. **Enable Developer Mode**: Toggle the **"Developer mode"** switch in the top-right corner.
4. **Load Unpacked**: Click the **"Load unpacked"** button and select the folder containing these files.
5. **Verify**: You should see the **ChatGPT Bulk Delete** extension icon in your list.

## 📖 How to Use

1. Navigate to [chatgpt.com](https://chatgpt.com).
2. Look for the **floating green trash icon** at the bottom right of your screen.
   - _Note: You may need to scroll through your chat history sidebar first so the extension can "collect" the chat titles._
3. Click the button to open the **Deletion Manager**.
4. Select the conversations you wish to remove.
5. Click **"Delete Selected"**.
6. You can close the modal while it deletes; the green button will show a **circular progress ring** to let you know it's still working!

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any features or bug fixes.

## 📄 License

MIT License - feel free to use and modify for your own needs.
