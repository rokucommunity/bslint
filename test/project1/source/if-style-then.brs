sub test()
    a = Rnd(10)
    if a = 0 then
        print "zero"
    else if(a <= 5)then
        print "low"
    else if a > 5 then
        print "high"
    end if

    if a = 10 then print "impossible!"
    if(a = 11) then print "even more!"
    if (a = 12) then print "and more!"

    while(a < 20)
        a++
    end while
    while (a < 30)
        a++
    end while
    while a > 0
        a--
    end while
end sub
