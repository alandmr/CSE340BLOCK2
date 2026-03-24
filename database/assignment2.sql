-- Data for table `account`
INSERT INTO public.account (
        account_firstname,
        account_lastname,
        account_email,
        account_password
    )
VALUES ('Tony', 'Stark', 'tony@starkent.com', 'Iam1ronM@n');
UPDATE public.account
SET account_type = 'Admin'
WHERE account_id = LASTVAL();
DELETE FROM public.account
WHERE account_id = LASTVAL();
UPDATE public.inventory
SET inv_description = REPLACE(
        inv_description,
        'small interiors',
        'huge interior'
    )
WHERE inv_id = 10;
SELECT inv_make,
    inv_model
FROM public.inventory
    INNER JOIN public.classification ON public.inventory.classification_id = public.classification.classification_id
WHERE public.classification.classification_name = 'Sport';
UPDATE public.inventory
SET inv_image = REPLACE(inv_image, '/images', '/images/vehicles'),
    inv_thumbnail = REPLACE(inv_thumbnail, '/images', '/images/vehicles');