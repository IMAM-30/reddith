<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommunityController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VoteController;
use Illuminate\Support\Facades\Route;

// ── Public Routes ──────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{post}', [PostController::class, 'show']);

Route::get('/communities', [CommunityController::class, 'index']);
Route::get('/communities/{community:slug}', [CommunityController::class, 'show']);
Route::get('/communities/{community:slug}/posts', [PostController::class, 'byCommunity']);

Route::get('/posts/{post}/comments', [CommentController::class, 'index']);

Route::get('/search', [SearchController::class, 'search']);

Route::get('/profile/{id}', [UserController::class, 'profile']);
Route::get('/users/{user:username}', [UserController::class, 'show']);
Route::get('/users/{user:username}/posts', [UserController::class, 'posts']);

// ── Protected Routes ───────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Communities
    Route::post('/communities', [CommunityController::class, 'store']);
    Route::post('/communities/{community:slug}/join', [CommunityController::class, 'join']);
    Route::delete('/communities/{community:slug}/leave', [CommunityController::class, 'leave']);

    // Posts
    Route::post('/posts', [PostController::class, 'store']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    // Comments
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
    Route::delete('/posts/{post}/comments/{comment}', [CommentController::class, 'destroy']);

    // Votes
    Route::post('/posts/{post}/vote', [VoteController::class, 'votePost']);
    Route::post('/comments/{comment}/vote', [VoteController::class, 'voteComment']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Direct Messages
    Route::get('/messages/inbox', [MessageController::class, 'inbox']);
    Route::get('/messages/sent', [MessageController::class, 'sent']);
    Route::get('/messages/conversation/{user}', [MessageController::class, 'conversation']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::patch('/messages/{message}/read', [MessageController::class, 'read']);
});
