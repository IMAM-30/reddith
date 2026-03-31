<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommunityRequest;
use App\Models\Community;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CommunityController extends Controller
{
    public function index(): JsonResponse
    {
        $communities = Community::withCount('members', 'posts')
            ->latest()
            ->paginate(15);

        return response()->json($communities);
    }

    public function store(StoreCommunityRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']);

        if ($request->hasFile('icon')) {
            $data['icon'] = $request->file('icon')->store('communities', 'public');
        }

        $community = $request->user()->communities()->create($data);

        // Creator auto-joins
        $community->members()->attach($request->user()->id);

        return response()->json($community->load('creator'), 201);
    }

    public function show(Community $community): JsonResponse
    {
        $community->loadCount('members', 'posts')->load('creator');

        return response()->json($community);
    }

    public function join(Request $request, Community $community): JsonResponse
    {
        $community->members()->syncWithoutDetaching([$request->user()->id]);

        return response()->json(['message' => 'Joined community.']);
    }

    public function leave(Request $request, Community $community): JsonResponse
    {
        $community->members()->detach($request->user()->id);

        return response()->json(['message' => 'Left community.']);
    }
}
