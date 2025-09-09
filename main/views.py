from django.shortcuts import render
from django.http import HttpResponse
# Create your views here.

def main(request):
    context = {
        "app_name": "Labubu Shop",
        "nama" : "Haekal Alexander Dinova",
        "NPM": 2406352424
    }
    return render(request, "main.html", context)