import uuid
from django.db import models

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('player equipment', 'Player Equipment'),
        ('training and match gear', 'Training & Match Gear'),
        ('fan merchandise', 'Fan Merchandise'),
        ('footwear and apparel accessories', 'footwear & apparel accessories'),
        ('Maintenance and care', 'Maintenance & Care'),
        ('Lifestyle and Casual', 'Lifestyle & Casual'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default='update')
    thumbnail = models.URLField(blank=True, null=True)
    price = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    is_featured = models.BooleanField(default=False)
    sold = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return self.title
    

    