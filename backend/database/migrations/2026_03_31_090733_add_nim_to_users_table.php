<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'nim')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('nim')->nullable()->after('email');
            });
        }

        // Assign temporary unique NIM to existing users
        $users = DB::table('users')->whereNull('nim')->orWhere('nim', '')->get();
        foreach ($users as $index => $user) {
            DB::table('users')->where('id', $user->id)->update([
                'nim' => '000000' . str_pad($user->id, 3, '0', STR_PAD_LEFT),
            ]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('nim')->nullable(false)->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('nim');
        });
    }
};
