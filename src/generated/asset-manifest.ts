/* GENERATED FILE - do not edit by hand.
 * Source: sprites/ via scripts/build-assets.ts
 * Regenerate with: bun run scripts/build-assets.ts
 */
export type AssetSheet = {
  image: string;
  width: number;
  height: number;
  frameCount: number;
  counts: Record<string, number>;
  labels: Record<string, number>;
};

export type NpcSheetMeta = {
  character: string;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  rows: number;
  animations: Record<string, { frames: number[]; row: number; frameRate: number; repeat: number }>;
};

export type AssetManifest = {
  generatedBy: string;
  frameTotal: number;
  npcCell: { w: number; h: number };
  sheets: Record<string, AssetSheet>;
  npcs: Record<string, NpcSheetMeta>;
};

export const ASSETS: AssetManifest = {
  "generatedBy": "scripts/build-assets.ts",
  "frameTotal": 2581,
  "npcCell": {
    "w": 24,
    "h": 28
  },
  "sheets": {
    "rpg_terrain": {
      "image": "assets/atlases/rpg_terrain.png",
      "width": 2037,
      "height": 477,
      "frameCount": 171,
      "counts": {
        "prop": 76,
        "tile": 95
      },
      "labels": {
        "prop/prop": 76,
        "tile/grass-tile": 21,
        "tile/ground-tile": 18,
        "tile/soil-tile": 32,
        "tile/stone-tile": 7,
        "tile/water-tile": 17
      }
    },
    "water_environmental": {
      "image": "assets/atlases/water_environmental.png",
      "width": 2037,
      "height": 394,
      "frameCount": 218,
      "counts": {
        "prop": 128,
        "tile": 90
      },
      "labels": {
        "prop/prop": 128,
        "tile/grass-tile": 9,
        "tile/ground-tile": 29,
        "tile/soil-tile": 14,
        "tile/water-tile": 10,
        "tile/stone-tile": 28
      }
    },
    "trees_and_vegetation": {
      "image": "assets/atlases/trees_and_vegetation.png",
      "width": 2047,
      "height": 391,
      "frameCount": 217,
      "counts": {
        "plant": 77,
        "prop": 140
      },
      "labels": {
        "plant/blossom": 10,
        "plant/plant": 45,
        "prop/prop": 140,
        "plant/foliage-wide": 8,
        "plant/foliage": 14
      }
    },
    "farming_pixel_art": {
      "image": "assets/atlases/farming_pixel_art.png",
      "width": 2047,
      "height": 352,
      "frameCount": 238,
      "counts": {
        "prop": 62,
        "plant": 140,
        "tile": 36
      },
      "labels": {
        "prop/prop": 62,
        "plant/plant": 116,
        "plant/foliage": 12,
        "plant/blossom": 11,
        "tile/soil-tile": 31,
        "tile/ground-tile": 5,
        "plant/foliage-wide": 1
      }
    },
    "buildings_interiors": {
      "image": "assets/atlases/buildings_interiors.png",
      "width": 2044,
      "height": 499,
      "frameCount": 169,
      "counts": {
        "prop": 122,
        "structure": 47
      },
      "labels": {
        "prop/prop": 122,
        "structure/building-wide": 41,
        "structure/building-tall": 6
      }
    },
    "environmental_effects": {
      "image": "assets/atlases/environmental_effects.png",
      "width": 2032,
      "height": 257,
      "frameCount": 238,
      "counts": {
        "effect": 238
      },
      "labels": {
        "effect/wisp": 17,
        "effect/mote": 32,
        "effect/spark": 124,
        "effect/ember": 65
      }
    },
    "pixel_rpg_ui_asset": {
      "image": "assets/atlases/pixel_rpg_ui_asset.png",
      "width": 2045,
      "height": 339,
      "frameCount": 201,
      "counts": {
        "ui": 201
      },
      "labels": {
        "ui/ui-piece": 201
      }
    },
    "wildlife_sprite": {
      "image": "assets/atlases/wildlife_sprite.png",
      "width": 2048,
      "height": 241,
      "frameCount": 361,
      "counts": {
        "creature": 361
      },
      "labels": {
        "creature/animal-side": 81,
        "creature/animal-front": 280
      }
    },
    "rpg_asset": {
      "image": "assets/atlases/rpg_asset.png",
      "width": 2032,
      "height": 360,
      "frameCount": 186,
      "counts": {
        "prop": 146,
        "effect": 16,
        "structure": 12,
        "tile": 10,
        "plant": 2
      },
      "labels": {
        "prop/prop": 146,
        "effect/spark": 6,
        "effect/wisp": 1,
        "effect/ember": 7,
        "effect/mote": 2,
        "structure/building-tall": 6,
        "structure/building-wide": 6,
        "tile/water-tile": 1,
        "tile/ground-tile": 8,
        "plant/foliage-wide": 2,
        "tile/stone-tile": 1
      }
    },
    "pixel_art_asset": {
      "image": "assets/atlases/pixel_art_asset.png",
      "width": 2026,
      "height": 1009,
      "frameCount": 152,
      "counts": {
        "effect": 21,
        "prop": 119,
        "structure": 10,
        "plant": 2
      },
      "labels": {
        "effect/ember": 14,
        "prop/prop": 119,
        "structure/building-wide": 7,
        "plant/foliage-wide": 1,
        "effect/mote": 4,
        "plant/foliage": 1,
        "structure/building-tall": 3,
        "effect/spark": 3
      }
    },
    "pixel_character_sheets": {
      "image": "assets/atlases/pixel_character_sheets.png",
      "width": 2036,
      "height": 435,
      "frameCount": 430,
      "counts": {
        "creature": 430
      },
      "labels": {
        "creature/animal-side": 40,
        "creature/animal-front": 390
      }
    }
  },
  "npcs": {
    "aiko": {
      "character": "aiko",
      "cellWidth": 24,
      "cellHeight": 28,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "daichi": {
      "character": "daichi",
      "cellWidth": 26,
      "cellHeight": 27,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "ema": {
      "character": "ema",
      "cellWidth": 24,
      "cellHeight": 28,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "fuyu": {
      "character": "fuyu",
      "cellWidth": 24,
      "cellHeight": 29,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "haru": {
      "character": "haru",
      "cellWidth": 23,
      "cellHeight": 27,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "hina": {
      "character": "hina",
      "cellWidth": 23,
      "cellHeight": 28,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "kei": {
      "character": "kei",
      "cellWidth": 23,
      "cellHeight": 26,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "kohana": {
      "character": "kohana",
      "cellWidth": 24,
      "cellHeight": 27,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "kuro": {
      "character": "kuro",
      "cellWidth": 24,
      "cellHeight": 28,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "mika": {
      "character": "mika",
      "cellWidth": 23,
      "cellHeight": 27,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "natsu": {
      "character": "natsu",
      "cellWidth": 25,
      "cellHeight": 27,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "ren": {
      "character": "ren",
      "cellWidth": 24,
      "cellHeight": 27,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "riku": {
      "character": "riku",
      "cellWidth": 25,
      "cellHeight": 29,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "sakura": {
      "character": "sakura",
      "cellWidth": 25,
      "cellHeight": 27,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "shiro": {
      "character": "shiro",
      "cellWidth": 25,
      "cellHeight": 28,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "souta": {
      "character": "souta",
      "cellWidth": 21,
      "cellHeight": 26,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "tomo": {
      "character": "tomo",
      "cellWidth": 24,
      "cellHeight": 27,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    },
    "yuki": {
      "character": "yuki",
      "cellWidth": 25,
      "cellHeight": 25,
      "columns": 12,
      "rows": 4,
      "animations": {
        "idle_down": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_left": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_right": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "idle_up": {
          "frames": [
            0,
            1,
            2,
            3
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        },
        "walk_down": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 0,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_left": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 1,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_right": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 2,
          "frameRate": 8,
          "repeat": -1
        },
        "walk_up": {
          "frames": [
            4,
            5,
            6,
            7
          ],
          "row": 3,
          "frameRate": 8,
          "repeat": -1
        },
        "interact_down": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 0,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_left": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 1,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_right": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 2,
          "frameRate": 6,
          "repeat": -1
        },
        "interact_up": {
          "frames": [
            8,
            9,
            10,
            11
          ],
          "row": 3,
          "frameRate": 6,
          "repeat": -1
        }
      }
    }
  }
};
