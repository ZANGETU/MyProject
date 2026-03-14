# McSkinPackBot

This Discord bot allows you to create **Minecraft Bedrock Edition skin packs (.mcpack)** directly from Discord.  
Simply upload skin images and the bot will automatically generate a `.mcpack` file.

*Note: This program is not yet complete.*

When using this program, please follow the instructions in the **README.md** and **LICENSE** files located in the `discordbot` folder.

---

## Features

- `/skin create`  
  Create a new skin pack

- `/skin add`  
  Add PNG skins

- `/skin setting`  
  Edit skin name and arm type (Steve / Alex)

- `/skin delete`  
  Delete a skin

- `/skin build`  
  Generate and download the `.mcpack`

---

## Usage

### 1. Create a Skin Pack

```
/skin create
```

Enter the name of the skin pack.

---

### 2. Add Skins

```
/skin add
```

Upload PNG skin files.

---

### 3. Edit Skin Settings

```
/skin setting
```

- Change the skin name  
- Change the arm type (Steve / Alex)

---

### 4. Delete a Skin

```
/skin delete
```

Select the skin you want to delete.

---

### 5. Generate the mcpack

```
/skin build
```

A `.mcpack` file will be generated and available for download.

---

## Libraries Used

- discord.js
- archiver
- uuid
- node-fetch
- fs-extra

---

## Notice

This project is an **unofficial tool for Minecraft Bedrock Edition**.  
It is not affiliated with Mojang or Microsoft.