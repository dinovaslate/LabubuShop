from django.shortcuts import render, redirect, get_object_or_404
from main.forms import ProductForm
from main.models import Product
from django.http import HttpResponse, JsonResponse
from django.core import serializers
from django.contrib import messages
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import datetime
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.contrib.auth.models import User
from django.template.loader import render_to_string


# RIGHT
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.http import JsonResponse  # if your delete view returns JSON


@login_required(login_url='/login')
def show_main(request):
    
    filter_type = request.GET.get("filter", "all")
    if filter_type == "all":
        product_list = Product.objects.all()
    else:
        product_list = Product.objects.filter(user=request.user)

    context = {
        'npm' : '2406352424',
        'name': 'Haekal Alexander Dinova',
        'class': 'PBP C',
        'product_list': product_list,
        'last_login': request.COOKIES.get('last_login', 'Never'),
        'active': request.user
    }

    return render(request, "main.html", context)

@require_http_methods(["GET", "POST"])
def login_user(request):
    is_ajax = request.headers.get("x-requested-with") == "XMLHttpRequest"

    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, f"Welcome back, {user.username}!")

            if is_ajax:
                # Send JSON + set the same cookie you'd set on normal redirect
                resp = JsonResponse({
                    "ok": True,
                    "message": f"Welcome back, {user.username}!",
                    "redirect": reverse("main:show_main"),
                })
                resp.set_cookie('last_login', str(datetime.datetime.now()))
                return resp

            response = HttpResponseRedirect(reverse("main:show_main"))
            response.set_cookie('last_login', str(datetime.datetime.now()))
            return response

        # invalid form (AJAX) → send the whole page HTML; front-end will pick #login-fragment
        if is_ajax:
            html = render_to_string("login.html", {"form": form}, request=request)
            return HttpResponse(html, status=422)

    else:
        form = AuthenticationForm(request)

    # GET
    if is_ajax:
        html = render_to_string("login.html", {"form": form}, request=request)
        return HttpResponse(html)

    return render(request, 'login.html', {"form": form})



@require_POST
def logout_user(request):
    username = request.user.get_username()
    logout(request)
    if username:
        messages.success(request, f"Bye Bye, {username}!")
    else:
        messages.success(request, "Bye Bye")
    resp = redirect('main:login')
    resp.delete_cookie('last_login')
    return resp


@login_required(login_url='/login')
@require_POST
def delete_product(request, id):
    from django.shortcuts import get_object_or_404, redirect
    from django.contrib import messages
    from .models import Product

    product = get_object_or_404(Product, pk=id, user=request.user)
    product.delete()

    # If called via fetch() (AJAX), reply JSON so the UI can update without reload
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({"ok": True, "deleted_id": id})

    messages.success(request, "Product deleted.")
    return redirect("main:show_main")


@require_http_methods(["GET", "POST"])
def register(request):
    is_ajax = request.headers.get("x-requested-with") == "XMLHttpRequest"

    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Your account has been successfully created!')

            if is_ajax:
                return JsonResponse({
                    "ok": True,
                    "message": "Account created successfully.",
                    "redirect": reverse("main:login"),
                })
            return redirect('main:login')

        # invalid form → send full HTML; front-end will swap #register-fragment
        if is_ajax:
            html = render_to_string("register.html", {"form": form}, request=request)
            return HttpResponse(html, status=422)

    else:
        form = UserCreationForm()

    # GET
    if is_ajax:
        html = render_to_string("register.html", {"form": form}, request=request)
        return HttpResponse(html)

    return render(request, "register.html", {"form": form})


@login_required(login_url='/login')
@require_http_methods(["GET", "POST"])
def create_product(request):
    form = ProductForm(request.POST or None)
    is_ajax = request.headers.get("x-requested-with") == "XMLHttpRequest"

    if request.method == "POST":
        if form.is_valid():
            product = form.save(commit=False)
            product.user = request.user
            product.save()
            if is_ajax:
                # front-end will toast + refresh without reload
                return JsonResponse({"ok": True, "id": product.id})
            messages.success(request, "Product created successfully.")
            return redirect("main:show_main")

        # invalid form on AJAX → return fragment HTML back into modal
        if is_ajax:
            html = render_to_string("partials/create_product_fragment.html",
                                    {"form": form}, request=request)
            return HttpResponse(html, status=422)

    # GET
    if is_ajax:
        html = render_to_string("partials/create_product_fragment.html",
                                {"form": form}, request=request)
        return HttpResponse(html)

    # non-AJAX fallback page (what you uploaded)
    return render(request, "create_product.html", {"form": form})

@login_required(login_url='/login')
def show_product(request, id):
    product = get_object_or_404(Product, pk=id)
    context = {
        'product': product
    }
    return render(request, "product_detail.html", context)

def show_xml(request):
     product_list = Product.objects.all()
     xml_data = serializers.serialize("xml", product_list)
     return HttpResponse(xml_data, content_type="application/xml")

def show_json(request):
    product_list = Product.objects.all()
    json_data = serializers.serialize("json", product_list)
    return HttpResponse(json_data, content_type="application/json")

def show_xml_by_id(request, product_id):
   try:
       product_item = Product.objects.filter(pk=product_id)
       xml_data = serializers.serialize("xml", product_item)
       return HttpResponse(xml_data, content_type="application/xml")
   except Product.DoesNotExist:
       return HttpResponse(status=404)

def show_json_by_id(request, product_id):
   try:
       product_item = Product.objects.get(pk=product_id)
       json_data = serializers.serialize("json", [product_item])
       return HttpResponse(json_data, content_type="application/json")
   except Product.DoesNotExist:
       return HttpResponse(status=404)

@login_required(login_url='/login')
@require_http_methods(["GET", "POST"])
def edit_product(request, id):
    product = get_object_or_404(Product, pk=id, user=request.user)
    form = ProductForm(request.POST or None, instance=product)

    if request.method == "POST":
        if form.is_valid():
            form.save()
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"ok": True, "id": product.id})
            messages.success(request, "Product updated.")
            return redirect("main:show_main")
        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            html = render_to_string("partials/edit_product_fragment.html", {"form": form}, request=request)
            return HttpResponse(html, status=422)

    # GET
    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        html = render_to_string("partials/edit_product_fragment.html", {"form": form}, request=request)
        return HttpResponse(html)
    return render(request, "edit_product.html", {"form": form})

@login_required(login_url='/login')
@require_POST
def api_logout(request):
    username = request.user.get_username()
    logout(request)
    # Frontend will show this toast
    return JsonResponse({"ok": True, "message": ("Logged out " + username) if username else "Logged out"})










































