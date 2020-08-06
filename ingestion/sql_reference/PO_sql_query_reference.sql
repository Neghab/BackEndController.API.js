
-- retrieve all distinct makes with available packages with options
select * from
(
    select va.id as vehicle_id, va.vin, va.year, kda.make, kda.model, kda.body_style, kda.trim, kda.engine, kda.engine_id, kda.transmission, kda.ymmtbe_id, make_id, model_id, trim_id
    from VehicleMarketDM.dbo.kbb_description kda 
    join VehicleMarketDM.dbo.vehicle va on va.id = kda.vehicle_id
    where kda.vehicle_id in
    (
        select max(v.id)
        from VehicleMarketDM.dbo.kbb_description kd 
        join VehicleMarketDM.dbo.vehicle v on v.id = kd.vehicle_id
        join VehicleMarketDM.dbo.vehicle_merch_package vmp on vmp.vehicle_id = v.id
        join VehicleMarketDM.dbo.merch_package mp on vmp.merch_package_id = mp.id
        group by kd.trim_id
    )
)
as T
where T.year > 2010 and T.make_id is not null and T.model_id is not null and T.trim_id is not null
order by T.year desc, make asc, model asc, T.trim asc


-- retrieve all vehicles with valueAddOptions
select * from
(
    select va.id as vehicle_id, va.vin, va.year, kda.make, kda.model, kda.body_style, kda.trim, kda.engine, kda.engine_id, kda.transmission, kda.ymmtbe_id, make_id, model_id, trim_id
    from VehicleMarketDM.dbo.kbb_description kda 
    join VehicleMarketDM.dbo.vehicle va on va.id = kda.vehicle_id
    where kda.vehicle_id in
    (
        select max(v.id)
        from VehicleMarketDM.dbo.kbb_description kd 
        join VehicleMarketDM.dbo.vehicle v on v.id = kd.vehicle_id
        join VehicleMarketDM.dbo.vehicle_merch_option vmo on vmo.vehicle_id = v.id
        join VehicleMarketDM.dbo.merch_option mo on vmo.merch_option_id = mo.id
        group by kd.trim_id
    )
)
as T
where T.year > 2010 and T.make_id is not null and T.model_id is not null and T.trim_id is not null
order by T.year desc, make asc, model asc, T.trim asc


-- get all models and trims by make and starting year
SELECT distinct v.year, kd.make_id, kd.make, kd.model, kd.model_id, kd.trim, kd.trim_id
    FROM [VehicleMarketDM].[dbo].[kbb_description] kd
    join [VehicleMarketDM].[dbo].[vehicle] v on kd.vehicle_id = v.id
    where v.year >= 2012 and kd.make_id = 4
    and kd.trim_id is not null
    order by v.year desc, kd.make desc, kd.model desc, kd.trim desc

-- get all packages with options by make and starting year
SELECT distinct v.year, kd.make_id, kd.make, kd.model, kd.model_id, kd.trim, kd.trim_id, mp.id as package_id, mp.package_name, mp.price, mp.reference_count, mo.option_name, mo.id as option_id
    FROM [VehicleMarketDM].[dbo].[merch_package] mp
    join [VehicleMarketDM].[dbo].[kbb_description] kd on mp.kbb_ymmtbe_id = kd.ymmtbe_id
    join [VehicleMarketDM].[dbo].[merch_package_merch_option] mpmo on mp.id = mpmo.merch_package_id
    join [VehicleMarketDM].[dbo].[merch_option] mo on mpmo.merch_option_id = mo.id
    join [VehicleMarketDM].[dbo].[vehicle] v on kd.vehicle_id = v.id
    where v.year >= 2012 and kd.make_id = 4
    and kd.trim_id is not null
    and mp.price >= 50 and mp.price <= 12000
    order by reference_count desc, package_id, v.year desc, kd.make desc, kd.model desc, kd.trim desc, price desc, option_name asc

-- get all valueAddOptions by make and starting year
select distinct Vehicle.year, KBB.make_id, KBB.make, KBB.model_id, KBB.model, KBB.trim_id, KBB.trim, MerchOption.option_name, MerchOption.price, MerchOption.id as option_id,
    (select count(distinct vmo.vehicle_id)
    from vehicle_merch_option vmo
    join merch_option mo on vmo.merch_option_id = mo.id
    join VehicleMarketDM.dbo.kbb_description kbb on mo.kbb_ymmtbe_id = kbb.ymmtbe_id
    where MerchOption.id = mo.id and kbb.make_id = 4) AS reference_count
from VehicleMarketDM.dbo.merch_option MerchOption
join VehicleMarketDM.dbo.kbb_description KBB on MerchOption.kbb_ymmtbe_id = KBB.ymmtbe_id
join VehicleMarketDM.dbo.vehicle Vehicle on KBB.vehicle_id = Vehicle.id
where Vehicle.year = 2012 and KBB.make_id = 4 and MerchOption.kbb_ymmtbe_id like '2012-00000004%' and MerchOption.is_independently_available = 1 and MerchOption.price > 50 and MerchOption.price <= 6000
order by Vehicle.year desc, make_id desc, model_id desc, trim_id desc, reference_count desc





/*

    The rest of the queries below are for research/development and prototyping, and understanding the data structure of our POSE tables

*/



-- get all packages with options for ymmt
-- SELECT v.id, v.year, kd.make_id, kd.make, kd.model, kd.model_id, kd.trim, kd.trim_id, mp.id as package_id, mp.package_name, mp.price, mp.reference_count, mo.option_name, mo.id as option_id
--     FROM [VehicleMarketDM].[dbo].[merch_package] mp
--     join [VehicleMarketDM].[dbo].[merch_package_merch_option] mpmo on mp.id = mpmo.merch_package_id
--     join [VehicleMarketDM].[dbo].[merch_option] mo on mpmo.merch_option_id = mo.id
--     join [VehicleMarketDM].[dbo].[kbb_description] kd on mp.kbb_ymmtbe_id = kd.ymmtbe_id
--     join [VehicleMarketDM].[dbo].[vehicle] v on kd.vehicle_id = v.id
--     where v.year = 2012
--     and kd.make_id = 4 and kd.trim_id is not null
--     and mp.price >= 50 and mp.price <= 12000
--     order by v.year desc, kd.make desc, kd.model desc, kd.trim desc, reference_count desc, price desc, option_name asc


-- retrieve all packages with options for ymmt
SELECT distinct v.year, kd.make, kd.make_id, kd.model, kd.model_id, kd.trim, kd.trim_id, mp.id as package_id, mp.package_name, mp.price, mp.reference_count, mo.option_name, mo.id as option_id
    FROM [VehicleMarketDM].[dbo].[merch_package] mp
    join [VehicleMarketDM].[dbo].[merch_package_merch_option] mpmo on mp.id = mpmo.merch_package_id
    join [VehicleMarketDM].[dbo].[merch_option] mo on mpmo.merch_option_id = mo.id
    join [VehicleMarketDM].[dbo].[kbb_description] kd on mp.kbb_ymmtbe_id = kd.ymmtbe_id
    join [VehicleMarketDM].[dbo].[vehicle] v on kd.vehicle_id = v.id
    where v.year = 2012 and kd.make_id = 4 and kd.[trim_id] is not null
    and mp.price >= 50 and mp.price <= 12000
    order by reference_count desc, price desc, option_name asc

-- SELECT distinct v.year, kd.make_id, kd.make, kd.model, kd.model_id, kd.trim, kd.trim_id, mp.id as package_id, mp.package_name, mp.price, mp.reference_count, mo.option_name, mo.id as option_id
--     FROM [VehicleMarketDM].[dbo].[merch_package] mp
--     join [VehicleMarketDM].[dbo].[kbb_description] kd on mp.kbb_ymmtbe_id = kd.ymmtbe_id
--     join [VehicleMarketDM].[dbo].[merch_package_merch_option] mpmo on mp.id = mpmo.merch_package_id
--     join [VehicleMarketDM].[dbo].[merch_option] mo on mpmo.merch_option_id = mo.id
--     join [VehicleMarketDM].[dbo].[vehicle] v on kd.vehicle_id = v.id
--     where v.year = 2013 and kd.make_id = 4 and kd.model_id = 10 and kd.trim_id = 303794
--     and kd.trim_id is not null
--     and mp.price >= 50 and mp.price <= 12000
--     order by reference_count desc, package_id, v.year desc, kd.make desc, kd.model desc, kd.trim desc, price desc, option_name asc


-- retrieve all packages with options by ymmtid
-- SELECT mp.id as package_id, mp.package_name, mp.price, mp.reference_count, mo.option_name, mo.id as option_id
--     FROM [VehicleMarketDM].[dbo].[merch_package] mp
--     join [VehicleMarketDM].[dbo].[merch_package_merch_option] mpmo on mp.id = mpmo.merch_package_id
--     join [VehicleMarketDM].[dbo].[merch_option] mo on mpmo.merch_option_id = mo.id
--     where mp.kbb_ymmtbe_id like '2012-00000004-00000011%'
--     and mp.price >= 50 and mp.price <= 12000
--     order by reference_count desc, price desc, option_name asc


-- SELECT distinct mp.id as package_id, mp.package_name, mp.price, mp.reference_count, mo.option_name, mo.id as option_id
--                 FROM [VehicleMarketDM].[dbo].[merch_package] mp
--                 join [VehicleMarketDM].[dbo].[merch_package_merch_option] mpmo on mp.id = mpmo.merch_package_id
--                 join [VehicleMarketDM].[dbo].[merch_option] mo on mpmo.merch_option_id = mo.id
--                 join [VehicleMarketDM].[dbo].[kbb_description] kd on mp.kbb_ymmtbe_id = kd.ymmtbe_id
--                 where mp.kbb_ymmtbe_id like '2012-00000004-00000011%' and kd.make_id = 4 and kd.model_id = 11
--                 and mp.price >= 50 and mp.price <= 12000
--                 order by reference_count desc, price desc, option_name asc

-- SELECT distinct mp.id as package_id, mp.package_name, mp.price, mp.reference_count, mo.option_name, mo.id as option_id
--     FROM [VehicleMarketDM].[dbo].[merch_package] mp
--     join [VehicleMarketDM].[dbo].[merch_package_merch_option] mpmo on mp.id = mpmo.merch_package_id
--     join [VehicleMarketDM].[dbo].[merch_option] mo on mpmo.merch_option_id = mo.id
--     join [VehicleMarketDM].[dbo].[kbb_description] kd on mp.kbb_ymmtbe_id = kd.ymmtbe_id
--     where mp.kbb_ymmtbe_id like '2012-00000004%' and kd.make_id = 4
--     and mp.price >= 50 and mp.price <= 12000
--     order by reference_count desc, price desc, option_name asc


-- SELECT  *
-- FROM    (SELECT kd.make_id, kd.model_id, kd.trim_id, mp.id as package_id, mp.package_name, mp.price, mp.reference_count, mo.option_name, mo.id as option_id,
--                 ROW_NUMBER() OVER (PARTITION BY mo.id ORDER BY kd.trim_id) AS RowNumber
--          FROM [VehicleMarketDM].[dbo].[merch_package] mp
--         join [VehicleMarketDM].[dbo].[merch_package_merch_option] mpmo on mp.id = mpmo.merch_package_id
--         join [VehicleMarketDM].[dbo].[merch_option] mo on mpmo.merch_option_id = mo.id
--         join [VehicleMarketDM].[dbo].[kbb_description] kd on mp.kbb_ymmtbe_id = kd.ymmtbe_id
--         where mp.kbb_ymmtbe_id like '2012-00000004%') AS a
-- WHERE   a.RowNumber = 1

-- retrieve all valueAddOptions for ymmt by ymmt
select distinct Vehicle.year, KBB.make_id, KBB.model_id, KBB.trim_id, MerchOption.option_name, MerchOption.price, MerchOption.id as option_id,
        (select count(distinct vmo.vehicle_id)
            from vehicle_merch_option vmo
            join merch_option mo on vmo.merch_option_id = mo.id
            join VehicleMarketDM.dbo.kbb_description kbb on mo.kbb_ymmtbe_id = kbb.ymmtbe_id
            where MerchOption.id = mo.id and kbb.make_id = 4) AS reference_count
    from VehicleMarketDM.dbo.merch_option MerchOption
    join VehicleMarketDM.dbo.kbb_description KBB on MerchOption.kbb_ymmtbe_id = KBB.ymmtbe_id
    join VehicleMarketDM.dbo.vehicle Vehicle on KBB.vehicle_id = Vehicle.id
    where Vehicle.year = 2013 and KBB.make_id = 4 and KBB.model_id = 10 and KBB.trim_id = 303794 and MerchOption.is_independently_available = 1 and MerchOption.price > 50 and MerchOption.price <= 6000
    order by Vehicle.year desc, make_id desc, model_id desc, trim_id desc, reference_count desc

-- select distinct Vehicle.year, KBB.make_id, KBB.make, KBB.model_id, KBB.model, KBB.trim_id, KBB.trim, MerchOption.option_name, MerchOption.price, MerchOption.id as option_id,
--                 (select count(distinct vmo.vehicle_id)
--                 from vehicle_merch_option vmo
--                 join merch_option mo on vmo.merch_option_id = mo.id
--                 join VehicleMarketDM.dbo.kbb_description kbb on mo.kbb_ymmtbe_id = kbb.ymmtbe_id
--                 where MerchOption.id = mo.id and kbb.make_id = 9) AS reference_count
--             from VehicleMarketDM.dbo.merch_option MerchOption
--             join VehicleMarketDM.dbo.kbb_description KBB on MerchOption.kbb_ymmtbe_id = KBB.ymmtbe_id
--             join VehicleMarketDM.dbo.vehicle Vehicle on KBB.vehicle_id = Vehicle.id
--             where KBB.make_id = 9 and MerchOption.kbb_ymmtbe_id like '20__-00000009%' and KBB.model like 'Bolt%' and MerchOption.is_independently_available = 1 and MerchOption.price > 50 and MerchOption.price <= 6000
--             --Vehicle.year = 2016 and 
--             order by Vehicle.year desc, make_id desc, model_id desc, trim_id desc, reference_count desc


select distinct kd.make, kd.model, kd.trim, kd.vehicle_id
    from VehicleMarketDM.dbo.kbb_description kd
    join VehicleMarketDM.dbo.vehicle v on v.id = kd.vehicle_id
    join VehicleMarketDM.dbo.vehicle_merch_package vmp on vmp.vehicle_id = v.id
    join VehicleMarketDM.dbo.merch_package mp on vmp.merch_package_id = mp.id
    where v.year = 2016 and kd.make_id = 9 and kd.model_id = 49 and kd.trim_id = 329151

select distinct kbbd.make, kbbd.make_id
    from VehicleMarketDM.dbo.kbb_description kbbd
    join VehicleMarketDM.dbo.vehicle v on kbbd.vehicle_id = v.id
    where kbbd.make_id is not null
    ORDER BY kbbd.make asc


select distinct kd.make, kd.model, kd.trim, kd.vehicle_id
    from VehicleMarketDM.dbo.kbb_description kd
    join VehicleMarketDM.dbo.vehicle v on v.id = kd.vehicle_id
    join VehicleMarketDM.dbo.vehicle_merch_package vmp on vmp.vehicle_id = v.id
    join VehicleMarketDM.dbo.merch_package mp on vmp.merch_package_id = mp.id
    where v.year = 2013 and kd.make like 'audi' and kd.model is not null and kd.trim is not null


select distinct Vehicle.year, KBB.make_id, KBB.model_id, KBB.trim_id, MerchOption.option_name, MerchOption.price, MerchOption.id as option_id,
    (select count(distinct vmo.vehicle_id)
    from vehicle_merch_option vmo
    join merch_option mo on vmo.merch_option_id = mo.id
    join VehicleMarketDM.dbo.kbb_description kbb on mo.kbb_ymmtbe_id = kbb.ymmtbe_id
    where MerchOption.id = mo.id and kbb.make_id = 4) AS reference_count
from VehicleMarketDM.dbo.merch_option MerchOption
join VehicleMarketDM.dbo.kbb_description KBB on MerchOption.kbb_ymmtbe_id = KBB.ymmtbe_id
join VehicleMarketDM.dbo.vehicle Vehicle on KBB.vehicle_id = Vehicle.id
where Vehicle.year = 2013 and KBB.make_id = 4 and KBB.model_id = 10 and KBB.trim_id = 303794 and MerchOption.is_independently_available = 1 and MerchOption.price > 50 and MerchOption.price <= 6000
order by Vehicle.year desc, make_id desc, model_id desc, trim_id desc, reference_count desc


select distinct kd.make, kd.model, kd.trim, kd.vehicle_id
    from VehicleMarketDM.dbo.kbb_description kd
    join VehicleMarketDM.dbo.vehicle v on v.id = kd.vehicle_id
    join VehicleMarketDM.dbo.vehicle_merch_package vmp on vmp.vehicle_id = v.id
    join VehicleMarketDM.dbo.merch_package mp on vmp.merch_package_id = mp.id
    where v.year = 2020 and kd.make_id = 5 and kd.model_id = 40256 and kd.trim_id is not null


select distinct T.make, T.make_id from
(
    select va.id as vehicle_id, va.vin, va.year, kda.make, kda.model, kda.body_style, kda.trim, kda.engine, kda.transmission, kda.ymmtbe_id, make_id, model_id, trim_id
    from VehicleMarketDM.dbo.kbb_description kda 
    join VehicleMarketDM.dbo.vehicle va on va.id = kda.vehicle_id
    where kda.vehicle_id in
    (
        select max(v.id)
        from VehicleMarketDM.dbo.kbb_description kd 
        join VehicleMarketDM.dbo.vehicle v on v.id = kd.vehicle_id
        join VehicleMarketDM.dbo.vehicle_merch_package vmp on vmp.vehicle_id = v.id
        join VehicleMarketDM.dbo.merch_package mp on vmp.merch_package_id = mp.id
        group by kd.trim_id
    )
)
as T
where T.year >= 2012 and T.make_id is not null
order by make asc




-- SELECT distinct v.year, kd.make_id, kd.make, kd.model, kd.model_id, kd.trim, kd.trim_id
--     FROM [VehicleMarketDM].[dbo].[kbb_description] kd
--     join [VehicleMarketDM].[dbo].[vehicle] v on kd.vehicle_id = v.id
--     where v.year >= 2012 and kd.make_id = 4
--     and kd.trim_id is not null
--     order by v.year desc, kd.make desc, kd.model desc, kd.trim desc

