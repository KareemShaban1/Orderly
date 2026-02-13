<?php

namespace Database\Seeders;

use App\Models\Game;
use Illuminate\Database\Seeder;

class GameSeeder extends Seeder
{
    public function run(): void
    {
        Game::query()->delete();

        $games = [
            [
                'name' => 'Reaction Time',
                'slug' => 'reaction-time',
                'description' => 'Tap when the screen turns green. Test your reflexes. 3 levels.',
                'type' => 'reaction_time',
                'config' => [
                    'levels' => [
                        1 => ['rounds' => 3],
                        2 => ['rounds' => 5],
                        3 => ['rounds' => 8],
                    ],
                ],
                'sort_order' => 1,
            ],
            [
                'name' => '2048 Merge',
                'slug' => 'merge-2048',
                'description' => 'Merge tiles to reach the target. 3 levels.',
                'type' => 'merge_2048',
                'config' => [
                    'levels' => [
                        1 => ['target' => 512],
                        2 => ['target' => 1024],
                        3 => ['target' => 2048],
                    ],
                ],
                'sort_order' => 2,
            ],
            [
                'name' => 'Snake',
                'slug' => 'snake',
                'description' => 'Eat dots, grow longer. 3 speed levels.',
                'type' => 'snake',
                'config' => [
                    'levels' => [
                        1 => ['tick_ms' => 180, 'grid_size' => 12],
                        2 => ['tick_ms' => 120, 'grid_size' => 15],
                        3 => ['tick_ms' => 85, 'grid_size' => 18],
                    ],
                ],
                'sort_order' => 3,
            ],
            [
                'name' => 'Flappy Dodge',
                'slug' => 'flappy-dodge',
                'description' => 'Tap to fly. Avoid obstacles. 3 speed levels.',
                'type' => 'flappy_dodge',
                'config' => [
                    'levels' => [
                        1 => ['speed' => 2],
                        2 => ['speed' => 3],
                        3 => ['speed' => 4.5],
                    ],
                ],
                'sort_order' => 4,
            ],
            [
                'name' => 'Aim Trainer',
                'slug' => 'aim-trainer',
                'description' => 'Click targets fast. Speed and accuracy. 3 levels.',
                'type' => 'aim_trainer',
                'config' => [
                    'levels' => [
                        1 => ['rounds' => 5, 'time_limit_seconds' => 25],
                        2 => ['rounds' => 10, 'time_limit_seconds' => 30],
                        3 => ['rounds' => 15, 'time_limit_seconds' => 28],
                    ],
                ],
                'sort_order' => 5,
            ],
            [
                'name' => 'Simon Says',
                'slug' => 'simon-says',
                'description' => 'Repeat the sequence. 3 levels.',
                'type' => 'simon_says',
                'config' => [
                    'levels' => [
                        1 => ['max_rounds' => 5],
                        2 => ['max_rounds' => 8],
                        3 => ['max_rounds' => 12],
                    ],
                ],
                'sort_order' => 6,
            ],
            [
                'name' => 'Word Scramble',
                'slug' => 'word-scramble',
                'description' => 'Unscramble the word. 3 levels.',
                'type' => 'word_scramble',
                'config' => [
                    'levels' => [
                        1 => ['rounds' => 3, 'time_per_word_seconds' => 20],
                        2 => ['rounds' => 5, 'time_per_word_seconds' => 15],
                        3 => ['rounds' => 7, 'time_per_word_seconds' => 12],
                    ],
                ],
                'sort_order' => 7,
            ],
            [
                'name' => 'Quick Math',
                'slug' => 'quick-math',
                'description' => 'Solve math fast. Streak bonus. 3 levels.',
                'type' => 'quick_math',
                'config' => [
                    'levels' => [
                        1 => ['rounds' => 8, 'time_per_round_seconds' => 8],
                        2 => ['rounds' => 12, 'time_per_round_seconds' => 5],
                        3 => ['rounds' => 18, 'time_per_round_seconds' => 4],
                    ],
                ],
                'sort_order' => 8,
            ],
            [
                'name' => 'Whack-a-Mole',
                'slug' => 'whack-mole',
                'description' => 'Tap the moles. 3 levels.',
                'type' => 'whack_mole',
                'config' => [
                    'levels' => [
                        1 => ['duration_seconds' => 25, 'moles' => 9, 'spawn_interval_ms' => 800],
                        2 => ['duration_seconds' => 20, 'moles' => 9, 'spawn_interval_ms' => 600],
                        3 => ['duration_seconds' => 15, 'moles' => 9, 'spawn_interval_ms' => 450],
                    ],
                ],
                'sort_order' => 9,
            ],
        ];

        foreach ($games as $data) {
            Game::create(array_merge($data, ['is_active' => true]));
        }
    }
}
