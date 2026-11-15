# Gitakure interface structure

## Surface map

```text
Full-bleed Three.js scene
├── Main menu (left anchored, open scene kept visible)
│   ├── Gitakure title + subtitle
│   ├── Continue / New journey / Settings / GitHub memories / About
│   └── build marker, low-contrast support text
├── Gameplay HUD (edge zones)
│   ├── top-left: player status and world state
│   ├── top-right: time, weather, map cue
│   ├── bottom-center: interaction prompt
│   └── bottom-right: Inventory / Map / Pause affordances
├── Dialogue (bottom caption card)
│   ├── speaker tab
│   ├── readable caption text
│   └── keyboard / pointer dismiss affordance
└── Modals (centered parchment sheet)
    ├── settings: sequential controls with explicit labels
    ├── inventory: spatial 4×N item grid and detail pane
    └── world map: contextual map, no duplicated HUD chrome
```

## Reference-to-code mapping

| Reference | Contract | Implementation |
| --- | --- | --- |
| `main-menu.jpg` | left menu over a living sunset scene | `MainMenu.vue` + `styles.css` + menu camera mode |
| `mc-and-fmc.jpg` | stylized hero silhouettes and readable clothing blocks | `Player` + `CharacterFactory` |
| `npc.jpg` | five role silhouettes with accessories and palette separation | `NPC` role rigs |
| `invent.jpg` | settings/index and inventory sheet contrast | `SettingsModal.vue` + `InventoryModal.vue` |
| `s1.jpg`–`s3.jpg` | warm river village, path readability, HUD edge zones | `WorldManager`, lighting, HUD components |
| `s4.jpg` | bottom dialogue caption with speaker tab | `DialogueBox.vue` |
