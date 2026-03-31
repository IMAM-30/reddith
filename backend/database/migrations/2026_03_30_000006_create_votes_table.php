<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->morphs('voteable');
            $table->tinyInteger('value'); // 1 = upvote, -1 = downvote
            $table->timestamps();

            $table->unique(['user_id', 'voteable_id', 'voteable_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};
