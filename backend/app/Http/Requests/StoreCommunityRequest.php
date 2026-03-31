<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommunityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:communities',
            'description' => 'nullable|string|max:1000',
            'icon' => 'nullable|image|max:2048',
        ];
    }
}
