from django.urls import path
from main import views
from main.views import show_main, create_product, show_product, show_xml, show_json, show_xml_by_id, show_json_by_id, delete_product
from main.views import register
from main.views import logout_user, login_user
app_name = 'main'

urlpatterns = [
    path('', show_main, name='show_main'),
    path('create-product/', create_product, name='create_product'),
    path('product/<str:id>/', show_product, name='show_product'),
    path('xml/', show_xml, name='show_xml'),
    path('json/', show_json, name='show_json'),
    path('xml/<str:product_id>/', show_xml_by_id, name='show_xml_by_id'),
    path('json/<str:product_id>/', show_json_by_id, name='show_json_by_id'),
    path('register/', register, name='register'),
    path('logout/', logout_user, name='logout'),
    path('login/', login_user, name='login'),
    path("product/<uuid:id>/edit/", views.edit_product, name="edit_product"),
    path("delete_product/<uuid:id>", delete_product, name="delete_product")
]