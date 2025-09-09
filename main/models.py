from django.db import models
import uuid

class Product(models.Model):
    CATEGORY_CHOICES = [
        ("Labubu", "labubu"),
        ("Toy", "toy"),
        ("Shirt", "shirt")
    ]
    name = models.CharField(max_length=30)
    price = models.IntegerField()
    description = models.TextField()
    thumbnail = models.URLField()
    category = models.CharField(max_length=30)
    is_featured = models.BooleanField()
    rating = models.IntegerField()

# Create your models here.
